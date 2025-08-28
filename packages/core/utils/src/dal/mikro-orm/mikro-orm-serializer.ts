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
  populate?: string[] | boolean
  exclude?: string[]
  preventCircularRef?: boolean
  skipNull?: boolean
  ignoreSerializers?: boolean
  forceObject?: boolean
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

function isVisible<T extends object>(
  meta: EntityMetadata<T>,
  propName: string,
  options: Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  } = STATIC_OPTIONS_SHAPE
): boolean {
  const populate = options.populate
  if (populate === true) {
    return true
  }

  if (Array.isArray(populate)) {
    const exclude = options.exclude
    if (exclude && exclude.length > 0) {
      const excludeLen = exclude.length
      for (let i = 0; i < excludeLen; i++) {
        if (exclude[i] === propName) {
          return false
        }
      }
    }

    const propNameLen = propName.length
    const propPrefix = propName + DOT
    const populateLen = populate.length

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

  const prop = meta.properties[propName]
  const visible = (prop && !prop.hidden) || prop === undefined
  const prefixed = prop && !prop.primary && propName.charAt(0) === UNDERSCORE

  return visible && !prefixed
}

function isPopulated<T extends object>(
  entity: T,
  propName: string,
  options: Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  } = STATIC_OPTIONS_SHAPE
): boolean {
  const populate = options.populate

  if (Array.isArray(populate)) {
    const propNameLen = propName.length
    const propPrefix = propName + DOT
    const populateLen = populate.length

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

  if (typeof populate === "boolean") {
    return populate
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
  private static propertyCache = new Map<string, string>()
  private static PROPERTY_CACHE_SIZE = 2000

  private static readonly EMPTY_PARENTS: string[] = []
  private static readonly EMPTY_KEYS = new Set<string>()

  static serialize<T extends object, P extends string = never>(
    entity: T,
    options = STATIC_OPTIONS_SHAPE,
    parents: string[] = EMPTY_ARRAY
  ): EntityDTO<Loaded<T, P>> {
    const parents_ =
      parents.length > 0 ? Array.from(new Set(parents)) : this.EMPTY_PARENTS

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

    const keys = this.EMPTY_KEYS
    keys.clear()

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

    const className = meta.className
    const platform = wrapped.__platform
    const skipNull = options.skipNull

    for (let i = 0; i < keysLen; i++) {
      const prop = keysArray[i]

      if (
        !filterEntityPropToSerialize({
          propName: prop,
          meta,
          options,
          parents: parents_,
        })
      ) {
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

    const metaProps = meta.props
    const metaPropsLen = metaProps.length

    for (let i = 0; i < metaPropsLen; i++) {
      const prop = metaProps[i]
      if (
        prop.getter &&
        prop.getterName === undefined &&
        typeof entity[prop.name] !== "undefined" &&
        isVisible(meta, prop.name, options)
      ) {
        ret[this.propertyName(meta, prop.name, platform)] =
          this.processProperty(prop.name, entity, options, parents_)
      }
    }

    for (let i = 0; i < metaPropsLen; i++) {
      const prop = metaProps[i]
      if (
        prop.getterName &&
        (entity[prop.getterName] as unknown) instanceof Function &&
        isVisible(meta, prop.name, options)
      ) {
        ret[this.propertyName(meta, prop.name, platform)] =
          this.processProperty(
            prop.getterName as keyof T & string,
            entity,
            options,
            parents_
          )
      }
    }

    return ret
  }

  private static propertyName<T>(
    meta: EntityMetadata<T>,
    prop: string,
    platform?: Platform
  ): string {
    const cacheKey = `${meta.className}:${prop}:${
      platform?.constructor.name || "no-platform"
    }`

    if (this.propertyCache.has(cacheKey)) {
      return this.propertyCache.get(cacheKey)!
    }

    let result: string

    /* istanbul ignore next */
    if (meta.properties[prop]?.serializedName) {
      result = meta.properties[prop].serializedName as string
    } else if (meta.properties[prop]?.primary && platform) {
      result = platform.getSerializedPrimaryKeyField(prop) as string
    } else {
      result = prop
    }

    if (this.propertyCache.size >= this.PROPERTY_CACHE_SIZE) {
      this.propertyCache.clear()
    }
    this.propertyCache.set(cacheKey, result)

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
    const parents_ =
      parents.length > 0
        ? [...parents, entity.constructor.name]
        : [entity.constructor.name]

    const parts = prop.split(DOT)
    prop = parts[0] as string & keyof T
    const wrapped = helper(entity)
    const property = wrapped.__meta.properties[prop]
    const serializer = property?.serializer

    if ((entity[prop] as unknown) instanceof Function) {
      const returnValue = (
        entity[prop] as unknown as () => T[keyof T & string]
      )()
      if (!options.ignoreSerializers && serializer) {
        return serializer(returnValue)
      }
      return returnValue
    }

    /* istanbul ignore next */
    if (!options.ignoreSerializers && serializer) {
      return serializer(entity[prop])
    }

    if (Utils.isCollection(entity[prop])) {
      return this.processCollection(
        prop as keyof T & string,
        entity,
        options,
        parents_
      )
    }

    if (Utils.isEntity(entity[prop], true)) {
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
      if (Array.isArray(entity[prop])) {
        return (entity[prop] as object[]).map((item) =>
          helper(item).toJSON()
        ) as T[keyof T]
      }

      if (Utils.isObject(entity[prop])) {
        return helper(entity[prop]).toJSON() as T[keyof T]
      }
    }

    const customType = property?.customType

    if (customType) {
      return customType.toJSON(entity[prop], wrapped.__platform)
    }

    return wrapped.__platform.normalizePrimaryKey(
      entity[prop] as unknown as IPrimaryKey
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

    const extractChildElements = (items: string[]) => {
      const result: string[] = []
      const itemsLen = items.length

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

    return {
      ...options,
      populate:
        Array.isArray(populate) && !populate.includes(WILDCARD)
          ? extractChildElements(populate as unknown as string[])
          : populate,
      exclude:
        Array.isArray(exclude) && !exclude.includes(WILDCARD)
          ? extractChildElements(exclude)
          : exclude,
    } as Parameters<typeof EntitySerializer.serialize>[1] & {
      preventCircularRef?: boolean
      populate?: string[] | boolean
    }
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
  options?: Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  }
): Promise<TOutput> => {
  return new Promise<TOutput>((resolve) => {
    // Use the shared reference directly (this gives you the speedup)
    if (!options) {
      options = STATIC_OPTIONS_SHAPE
    } else {
      // Don't mutate the shared reference, create a copy if needed
      if (options === STATIC_OPTIONS_SHAPE) {
        options = { ...STATIC_OPTIONS_SHAPE, ...options }
      }
    }

    const data_ = (Array.isArray(data) ? data : [data]).filter(Boolean)

    const forSerialization: object[] = []
    const notForSerialization: object[] = []

    const dataLen = data_.length
    for (let i = 0; i < dataLen; i++) {
      const object = data_[i]
      if (object.__meta) {
        forSerialization.push(object)
      } else {
        notForSerialization.push(object)
      }
    }

    let result: any = forSerialization.map((entity) =>
      EntitySerializer.serialize(entity, options)
    ) as TOutput[]

    if (notForSerialization.length) {
      result = result.concat(notForSerialization)
    }

    resolve(Array.isArray(data) ? result : result[0])
  })
}
