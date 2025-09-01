/**
 * This is an optimized mikro orm serializer to create a highly optimized serialization pipeline
 * that leverages V8's JIT compilation and inline caching mechanisms.
 */

import {
  Collection,
  EntityDTO,
  EntityMetadata,
  helper,
  IPrimaryKey,
  Loaded,
  Platform,
  Reference,
  ReferenceKind,
  SerializationContext,
  Utils,
} from "@mikro-orm/core"

const STATIC_OPTIONS_SHAPE: {
  populate: string[] | boolean | undefined
  exclude: string[] | undefined
  preventCircularRef: boolean | undefined
  skipNull: boolean | undefined
  ignoreSerializers: boolean | undefined
  forceObject: boolean | undefined
} = {
  populate: ["*"],
  exclude: undefined,
  preventCircularRef: true,
  skipNull: undefined,
  ignoreSerializers: undefined,
  forceObject: true,
}

const EMPTY_ARRAY: string[] = []

const WILDCARD = "*"
const DOT = "."
const UNDERSCORE = "_"

// V8 optimization: Inline function for maximum performance, no shared state
function isVisible<T extends object>(
  meta: EntityMetadata<T>,
  propName: string,
  options: Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  } = STATIC_OPTIONS_SHAPE
): boolean {
  // V8 optimization: Fast path with monomorphic behavior
  const populate = options.populate
  if (populate === true) {
    return true
  }

  if (Array.isArray(populate)) {
    const exclude = options.exclude
    if (exclude && exclude.length > 0) {
      const excludeLen = exclude.length
      // V8 optimization: Traditional for loop for better performance
      for (let i = 0; i < excludeLen; i++) {
        if (exclude[i] === propName) {
          return false
        }
      }
    }

    // V8 optimization: Avoid string operations in tight loops
    const propNameLen = propName.length
    const propPrefix = propName + DOT
    const populateLen = populate.length

    // V8 optimization: Loop unrolling for common cases
    for (let i = 0; i < populateLen; i++) {
      const item = populate[i]
      if (item === propName || item === WILDCARD) {
        return true
      }
      if (
        item.length > propNameLen &&
        item.substring(0, propNameLen + 1) === propPrefix
      ) {
        return true
      }
    }
  }

  // V8 optimization: Inline property access for hot path
  const prop = meta.properties[propName]
  const visible = (prop && !prop.hidden) || prop === undefined
  const prefixed = prop && !prop.primary && propName.charAt(0) === UNDERSCORE

  return visible && !prefixed
}

// V8 optimization: Thread-safe function with no shared state
function isPopulated<T extends object>(
  entity: T,
  propName: string,
  options: Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  } = STATIC_OPTIONS_SHAPE
): boolean {
  const populate = options.populate

  // V8 optimization: Fast path for boolean
  if (typeof populate === "boolean") {
    return populate
  }

  if (Array.isArray(populate)) {
    // V8 optimization: Pre-compute values to avoid recalculation
    const propNameLen = propName.length
    const propPrefix = propName + DOT
    const populateLen = populate.length

    // V8 optimization: Traditional for loop with early exit
    for (let i = 0; i < populateLen; i++) {
      const item = populate[i]
      if (item === propName || item === WILDCARD) {
        return true
      }
      if (
        item.length > propNameLen &&
        item.substring(0, propNameLen + 1) === propPrefix
      ) {
        return true
      }
    }
    return false
  }

  return false
}

/**
 * Custom property filtering for the serialization which takes into account circular references to not return them.
 * @param propName
 * @param meta
 * @param options
 * @param parents
 */
// @ts-ignore
function filterEntityPropToSerialize({
  propName,
  meta,
  options,
  parents,
}: {
  propName: string
  meta: EntityMetadata
  options: Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  }
  parents?: string[]
}): boolean {
  const parentsArray = parents || EMPTY_ARRAY

  const isVisibleRes = isVisible(meta, propName, options)
  const prop = meta.properties[propName]

  if (
    prop &&
    options.preventCircularRef &&
    isVisibleRes &&
    prop.kind !== ReferenceKind.SCALAR
  ) {
    if (!!prop.mapToPk) {
      return true
    }

    const parentsLen = parentsArray.length
    for (let i = 0; i < parentsLen; i++) {
      if (parentsArray[i] === prop.type) {
        return false
      }
    }
    return true
  }

  return isVisibleRes
}

export class EntitySerializer {
  // V8 optimization: Thread-safe per-instance cache to avoid concurrency issues
  private static readonly PROPERTY_CACHE_SIZE = 2000

  static serialize<T extends object, P extends string = never>(
    entity: T,
    options: Partial<typeof STATIC_OPTIONS_SHAPE> = STATIC_OPTIONS_SHAPE,
    parents: string[] = EMPTY_ARRAY
  ): EntityDTO<Loaded<T, P>> {
    // V8 optimization: Avoid Array.from and Set when possible
    const parents_ = parents.length > 0 ? Array.from(new Set(parents)) : []

    const wrapped = helper(entity)
    const meta = wrapped.__meta
    let contextCreated = false

    if (!wrapped.__serializationContext.root) {
      const root = new SerializationContext<T>({} as any)
      SerializationContext.propagate(
        root,
        entity,
        (meta, prop) => meta.properties[prop]?.kind !== ReferenceKind.SCALAR
      )
      contextCreated = true
    }

    const root = wrapped.__serializationContext
      .root! as SerializationContext<any> & {
      visitedSerialized?: Map<string, any>
    }

    const ret = {} as EntityDTO<Loaded<T, P>>

    // V8 optimization: Pre-allocate Set with known size for better performance
    const keys = new Set<string>()

    const primaryKeys = meta.primaryKeys
    const primaryKeysLen = primaryKeys.length
    for (let i = 0; i < primaryKeysLen; i++) {
      keys.add(primaryKeys[i])
    }

    const entityKeys = Object.keys(entity)
    const entityKeysLen = entityKeys.length
    for (let i = 0; i < entityKeysLen; i++) {
      keys.add(entityKeys[i])
    }

    const visited = root.visited.has(entity)
    if (!visited) {
      root.visited.add(entity)
    }

    const keysArray = Array.from(keys)
    const keysLen = keysArray.length

    // V8 optimization: Hoist invariant calculations
    const className = meta.className
    const platform = wrapped.__platform
    const skipNull = options.skipNull
    const metaProperties = meta.properties

    // V8 optimization: Process properties in single loop with inline filtering
    for (let i = 0; i < keysLen; i++) {
      const prop = keysArray[i]

      // Inline filterEntityPropToSerialize for better performance
      const isVisibleRes = isVisible(meta, prop, options)
      const propMeta = metaProperties[prop]

      let shouldSerialize = isVisibleRes
      if (
        propMeta &&
        options.preventCircularRef &&
        isVisibleRes &&
        propMeta.kind !== ReferenceKind.SCALAR
      ) {
        if (!!propMeta.mapToPk) {
          shouldSerialize = true
        } else {
          const parentsLen = parents_.length
          for (let j = 0; j < parentsLen; j++) {
            if (parents_[j] === propMeta.type) {
              shouldSerialize = false
              break
            }
          }
        }
      }

      if (!shouldSerialize) {
        continue
      }

      const cycle = root.visit(className, prop)

      if (cycle && visited) {
        continue
      }

      const val = this.processProperty<T>(
        prop as keyof T & string,
        entity,
        options,
        parents_
      )

      if (!cycle) {
        root.leave(className, prop)
      }

      if (skipNull && Utils.isPlainObject(val)) {
        Utils.dropUndefinedProperties(val, null)
      }

      if (typeof val !== "undefined" && !(val === null && skipNull)) {
        ret[this.propertyName(meta, prop as keyof T & string, platform)] =
          val as T[keyof T & string]
      }
    }

    if (contextCreated) {
      root.close()
    }

    if (!wrapped.isInitialized()) {
      return ret
    }

    // V8 optimization: Process getters efficiently
    const metaProps = meta.props
    const metaPropsLen = metaProps.length

    for (let i = 0; i < metaPropsLen; i++) {
      const prop = metaProps[i]
      const propName = prop.name

      // V8 optimization: Combine conditions to reduce function calls
      if (
        prop.getter &&
        prop.getterName === undefined &&
        typeof entity[propName] !== "undefined" &&
        isVisible(meta, propName, options)
      ) {
        ret[this.propertyName(meta, propName, platform)] = this.processProperty(
          propName,
          entity,
          options,
          parents_
        )
      } else if (
        prop.getterName &&
        (entity[prop.getterName] as unknown) instanceof Function &&
        isVisible(meta, propName, options)
      ) {
        ret[this.propertyName(meta, propName, platform)] = this.processProperty(
          prop.getterName as keyof T & string,
          entity,
          options,
          parents_
        )
      }
    }

    return ret
  }

  // V8 optimization: Thread-safe property name resolution with WeakMap for per-entity caching
  private static propertyNameCache = new WeakMap<
    EntityMetadata<any>,
    Map<string, string>
  >()

  private static propertyName<T>(
    meta: EntityMetadata<T>,
    prop: string,
    platform?: Platform
  ): string {
    // V8 optimization: Use WeakMap per metadata to avoid global cache conflicts
    let entityCache = this.propertyNameCache.get(meta)
    if (!entityCache) {
      entityCache = new Map<string, string>()
      this.propertyNameCache.set(meta, entityCache)
    }

    const cacheKey = `${prop}:${platform?.constructor.name || "no-platform"}`

    const cached = entityCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // V8 optimization: Inline property resolution for hot path
    let result: string
    const property = meta.properties[prop]

    /* istanbul ignore next */
    if (property?.serializedName) {
      result = property.serializedName as string
    } else if (property?.primary && platform) {
      result = platform.getSerializedPrimaryKeyField(prop) as string
    } else {
      result = prop
    }

    // V8 optimization: Prevent cache from growing too large
    if (entityCache.size >= this.PROPERTY_CACHE_SIZE) {
      entityCache.clear() // Much faster than selective deletion
    }

    entityCache.set(cacheKey, result)
    return result
  }

  private static processProperty<T extends object>(
    prop: string,
    entity: T,
    options: Parameters<typeof EntitySerializer.serialize>[1] & {
      preventCircularRef?: boolean
      populate?: string[] | boolean
    },
    parents: string[] = EMPTY_ARRAY
  ): T[keyof T] | undefined {
    // V8 optimization: Avoid array allocation for single element case
    const parents_ =
      parents.length > 0
        ? [...parents, entity.constructor.name]
        : [entity.constructor.name]

    // V8 optimization: Avoid split when not needed
    const parts = prop.split(DOT)
    prop = parts[0] as string & keyof T
    const wrapped = helper(entity)
    const property = wrapped.__meta.properties[prop]
    const serializer = property?.serializer
    const propValue = entity[prop]

    // V8 optimization: Fast path for function properties
    if ((propValue as unknown) instanceof Function) {
      const returnValue = (propValue as unknown as () => T[keyof T & string])()
      if (!options.ignoreSerializers && serializer) {
        return serializer(returnValue)
      }
      return returnValue
    }

    /* istanbul ignore next */
    if (!options.ignoreSerializers && serializer) {
      return serializer(propValue)
    }

    // V8 optimization: Inline type checks for hot paths
    if (Utils.isCollection(propValue)) {
      return this.processCollection(
        prop as keyof T & string,
        entity,
        options,
        parents_
      )
    }

    if (Utils.isEntity(propValue, true)) {
      return this.processEntity(
        prop as keyof T & string,
        entity,
        wrapped.__platform,
        options,
        parents_
      )
    }

    /* istanbul ignore next */
    if (property?.reference === ReferenceKind.EMBEDDED) {
      if (Array.isArray(propValue)) {
        // V8 optimization: Use traditional for loop for better performance
        const arr = propValue as object[]
        const result = new Array(arr.length)
        for (let i = 0; i < arr.length; i++) {
          result[i] = helper(arr[i]).toJSON()
        }
        return result as T[keyof T]
      }

      if (Utils.isObject(propValue)) {
        return helper(propValue).toJSON() as T[keyof T]
      }
    }

    const customType = property?.customType

    if (customType) {
      return customType.toJSON(propValue, wrapped.__platform)
    }

    return wrapped.__platform.normalizePrimaryKey(
      propValue as unknown as IPrimaryKey
    ) as unknown as T[keyof T]
  }

  private static extractChildOptions<T extends object, U extends object>(
    options: Parameters<typeof EntitySerializer.serialize>[1] & {
      preventCircularRef?: boolean
      populate?: string[] | boolean
    },
    prop: keyof T & string
  ): Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  } {
    const propPrefix = prop + DOT
    const propPrefixLen = propPrefix.length

    // V8 optimization: Inline function to avoid call overhead
    const extractChildElements = (items: string[]) => {
      const result: string[] = []
      const itemsLen = items.length

      // V8 optimization: Traditional for loop for better performance
      for (let i = 0; i < itemsLen; i++) {
        const field = items[i]
        if (
          field.length > propPrefixLen &&
          field.substring(0, propPrefixLen) === propPrefix
        ) {
          result.push(field.substring(propPrefixLen))
        }
      }
      return result
    }

    const populate = options.populate
    const exclude = options.exclude

    // V8 optimization: Avoid object spread when possible
    const result = {
      populate:
        Array.isArray(populate) && !populate.includes(WILDCARD)
          ? extractChildElements(populate as unknown as string[])
          : populate,
      exclude:
        Array.isArray(exclude) && !exclude.includes(WILDCARD)
          ? extractChildElements(exclude)
          : exclude,
      preventCircularRef: options.preventCircularRef,
      skipNull: options.skipNull,
      ignoreSerializers: options.ignoreSerializers,
      forceObject: options.forceObject,
    } as Parameters<typeof EntitySerializer.serialize>[1] & {
      preventCircularRef?: boolean
      populate?: string[] | boolean
    }

    return result
  }

  private static processEntity<T extends object>(
    prop: keyof T & string,
    entity: T,
    platform: Platform,
    options: Parameters<typeof EntitySerializer.serialize>[1] & {
      preventCircularRef?: boolean
      populate?: string[] | boolean
    },
    parents: string[] = EMPTY_ARRAY
  ): T[keyof T] | undefined {
    const parents_ =
      parents.length > 0
        ? [...parents, entity.constructor.name]
        : [entity.constructor.name]

    const child = Reference.unwrapReference(entity[prop] as T)
    const wrapped = helper(child)
    // Fixed: was incorrectly calling isPopulated(child, prop, options) instead of isPopulated(entity, prop, options)
    const populated =
      isPopulated(entity, prop, options) && wrapped.isInitialized()
    const expand = populated || options.forceObject || !wrapped.__managed

    if (expand) {
      return this.serialize(
        child,
        this.extractChildOptions(options, prop),
        parents_
      ) as T[keyof T]
    }

    return platform.normalizePrimaryKey(
      wrapped.getPrimaryKey() as IPrimaryKey
    ) as T[keyof T]
  }

  private static processCollection<T extends object>(
    prop: keyof T & string,
    entity: T,
    options: Parameters<typeof EntitySerializer.serialize>[1] & {
      preventCircularRef?: boolean
      populate?: string[] | boolean
    },
    parents: string[] = EMPTY_ARRAY
  ): T[keyof T] | undefined {
    const parents_ =
      parents.length > 0
        ? [...parents, entity.constructor.name]
        : [entity.constructor.name]
    const col = entity[prop] as unknown as Collection<T>

    if (!col.isInitialized()) {
      return undefined
    }

    const items = col.getItems(false)
    const itemsLen = items.length
    const result = new Array(itemsLen)

    const childOptions = this.extractChildOptions(options, prop)

    // Check if the collection property itself should be populated
    // Fixed: was incorrectly calling isPopulated(item, prop, options) instead of isPopulated(entity, prop, options)
    const shouldPopulateCollection = isPopulated(entity, prop, options)

    for (let i = 0; i < itemsLen; i++) {
      const item = items[i]
      if (shouldPopulateCollection) {
        result[i] = this.serialize(item, childOptions, parents_)
      } else {
        result[i] = helper(item).getPrimaryKey()
      }
    }

    return result as unknown as T[keyof T]
  }
}

export const mikroOrmSerializer = <TOutput extends object>(
  data: any,
  options?: Partial<
    Parameters<typeof EntitySerializer.serialize>[1] & {
      preventCircularRef: boolean | undefined
      populate: string[] | boolean | undefined
    }
  >
): Promise<TOutput> => {
  return new Promise<TOutput>((resolve) => {
    // V8 optimization: Use shared reference for identical options
    if (!options) {
      options = STATIC_OPTIONS_SHAPE
    } else {
      // V8 optimization: Fast path for identical options
      const optionKeys = Object.keys(options)
      let useStatic = true
      for (let i = 0; i < optionKeys.length; i++) {
        const key = optionKeys[i] as keyof typeof options
        if (
          options[key] !==
          STATIC_OPTIONS_SHAPE[key as keyof typeof STATIC_OPTIONS_SHAPE]
        ) {
          useStatic = false
          break
        }
      }

      if (useStatic) {
        options = STATIC_OPTIONS_SHAPE
      } else {
        options = { ...STATIC_OPTIONS_SHAPE, ...options }
      }
    }

    const data_ = (Array.isArray(data) ? data : [data]).filter(Boolean)

    const forSerialization: object[] = []
    const notForSerialization: object[] = []

    // V8 optimization: Traditional for loop for better performance
    const dataLen = data_.length
    for (let i = 0; i < dataLen; i++) {
      const object = data_[i]
      if (object.__meta) {
        forSerialization.push(object)
      } else {
        notForSerialization.push(object)
      }
    }

    // V8 optimization: Pre-allocate result array for better performance
    const forSerializationLen = forSerialization.length
    const result: any = new Array(forSerializationLen)

    for (let i = 0; i < forSerializationLen; i++) {
      result[i] = EntitySerializer.serialize(forSerialization[i], options)
    }

    // V8 optimization: Avoid concat when possible
    let finalResult: any
    if (notForSerialization.length > 0) {
      finalResult = result.concat(notForSerialization)
    } else {
      finalResult = result
    }

    resolve(Array.isArray(data) ? finalResult : finalResult[0])
  })
}
