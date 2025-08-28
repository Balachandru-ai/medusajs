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
  SerializeOptions,
  Utils,
} from "@mikro-orm/core"

type CustomSerializeOptions<T, P = any> = SerializeOptions<T, P & string> & {
  preventCircularRef?: boolean
  populate?: [keyof T][] | boolean
}

// V8 Optimization: Static object shapes for consistent property access patterns
const STATIC_OPTIONS_SHAPE = {
  populate: undefined,
  exclude: undefined,
  preventCircularRef: undefined,
  skipNull: undefined,
  ignoreSerializers: undefined,
  forceObject: undefined,
}

// V8 Optimization: Pre-allocated arrays to avoid hidden class transitions
const EMPTY_ARRAY: string[] = []
const EMPTY_OBJECT = {}

// V8 Optimization: Constants for string operations (avoid string allocation)
const WILDCARD = "*"
const DOT = "."
const UNDERSCORE = "_"

// V8 Optimization: Monomorphic function with consistent parameter shapes
function isVisible<T extends object>(
  meta: EntityMetadata<T>,
  propName: string,
  options: CustomSerializeOptions<T> = STATIC_OPTIONS_SHAPE
): boolean {
  // V8 Optimization: Early return for monomorphic path
  const populate = options.populate
  if (populate === true) {
    return true
  }

  // V8 Optimization: Use monomorphic array check
  if (Array.isArray(populate)) {
    const exclude = options.exclude
    if (exclude && exclude.length > 0) {
      // V8 Optimization: Monomorphic loop with consistent array access
      const excludeLen = exclude.length
      for (let i = 0; i < excludeLen; i++) {
        if (exclude[i] === propName) {
          return false
        }
      }
    }

    // V8 Optimization: Pre-compute string length to avoid repeated property access
    const propNameLen = propName.length
    const propPrefix = propName + DOT
    const populateLen = populate.length

    // V8 Optimization: Monomorphic loop with consistent array access
    for (let i = 0; i < populateLen; i++) {
      const item = populate[i]
      if (item === propName || item === WILDCARD) {
        return true
      }
      // V8 Optimization: Use length check before substring for early exit
      if (
        item.length > propNameLen &&
        item.substring(0, propNameLen + 1) === propPrefix
      ) {
        return true
      }
    }
  }

  // V8 Optimization: Cache property access to maintain monomorphic shape
  const prop = meta.properties[propName]
  const visible = (prop && !prop.hidden) || prop === undefined
  // V8 Optimization: Use charAt(0) for single character check (faster than startsWith)
  const prefixed = prop && !prop.primary && propName.charAt(0) === UNDERSCORE

  return visible && !prefixed
}

// V8 Optimization: Monomorphic function with consistent parameter shapes
function isPopulated<T extends object>(
  entity: T,
  propName: string,
  options: CustomSerializeOptions<T> = STATIC_OPTIONS_SHAPE
): boolean {
  const populate = options.populate

  // V8 Optimization: Monomorphic array check
  if (Array.isArray(populate)) {
    const propNameLen = propName.length
    const propPrefix = propName + DOT
    const populateLen = populate.length

    // V8 Optimization: Monomorphic loop with consistent array access
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

  // V8 Optimization: Monomorphic boolean check
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
// V8 Optimization: Monomorphic function with consistent parameter shapes
function filterEntityPropToSerialize({
  propName,
  meta,
  options,
  parents,
}: {
  propName: string
  meta: EntityMetadata
  options: CustomSerializeOptions<any>
  parents?: string[]
}): boolean {
  // V8 Optimization: Use consistent array shape
  const parentsArray = parents || EMPTY_ARRAY

  const isVisibleRes = isVisible(meta, propName, options)
  const prop = meta.properties[propName]

  // Only prevent circular references if prop is a relation
  if (
    prop &&
    options.preventCircularRef &&
    isVisibleRes &&
    prop.kind !== ReferenceKind.SCALAR
  ) {
    // mapToPk would represent a foreign key and we want to keep them
    if (!!prop.mapToPk) {
      return true
    }

    // V8 Optimization: Monomorphic loop with consistent array access
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
  // V8 Optimization: Static property cache with consistent Map shape
  private static propertyCache = new Map<string, string>()
  private static PROPERTY_CACHE_SIZE = 2000

  // V8 Optimization: Pre-allocated objects for consistent shapes
  private static readonly EMPTY_PARENTS: string[] = []
  private static readonly EMPTY_KEYS = new Set<string>()

  static serialize<T extends object, P extends string = never>(
    entity: T,
    options: CustomSerializeOptions<T, P> = STATIC_OPTIONS_SHAPE,
    parents: string[] = EMPTY_ARRAY
  ): EntityDTO<Loaded<T, P>> {
    // V8 Optimization: Use consistent array shape
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

    // V8 Optimization: Use consistent object shape
    const ret = {} as EntityDTO<Loaded<T, P>>

    // V8 Optimization: Reuse Set object to maintain hidden class
    const keys = this.EMPTY_KEYS
    keys.clear()

    // V8 Optimization: Batch add keys to maintain Set hidden class
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

    // V8 Optimization: Convert to array once and use monomorphic loop
    const keysArray = Array.from(keys)
    const keysLen = keysArray.length

    // V8 Optimization: Cache frequently accessed properties
    const className = meta.className
    const platform = wrapped.__platform
    const skipNull = options.skipNull

    // V8 Optimization: Single pass processing with monomorphic loop
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
        // V8 Optimization: Direct property assignment to maintain object shape
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

    // V8 Optimization: Cache meta.props reference to maintain monomorphic access
    const metaProps = meta.props
    const metaPropsLen = metaProps.length

    // V8 Optimization: Monomorphic loop for decorated getters
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

    // V8 Optimization: Monomorphic loop for decorated get methods
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

  // V8 Optimization: Monomorphic function with consistent parameter shapes
  private static propertyName<T>(
    meta: EntityMetadata<T>,
    prop: string,
    platform?: Platform
  ): string {
    // V8 Optimization: Cache property name lookups with consistent Map shape
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

    // V8 Optimization: Cache the result with consistent Map shape
    if (this.propertyCache.size >= this.PROPERTY_CACHE_SIZE) {
      this.propertyCache.clear()
    }
    this.propertyCache.set(cacheKey, result)

    return result
  }

  // V8 Optimization: Monomorphic function with consistent parameter shapes
  private static processProperty<T extends object>(
    prop: string,
    entity: T,
    options: CustomSerializeOptions<T>,
    parents: string[] = EMPTY_ARRAY
  ): T[keyof T] | undefined {
    // V8 Optimization: Use consistent array shape
    const parents_ =
      parents.length > 0
        ? [...parents, entity.constructor.name]
        : [entity.constructor.name]

    const parts = prop.split(DOT)
    prop = parts[0] as string & keyof T
    const wrapped = helper(entity)
    const property = wrapped.__meta.properties[prop]
    const serializer = property?.serializer

    // getter method
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

  // V8 Optimization: Monomorphic function with consistent parameter shapes
  private static extractChildOptions<T extends object, U extends object>(
    options: CustomSerializeOptions<T>,
    prop: keyof T & string
  ): CustomSerializeOptions<U> {
    // V8 Optimization: Pre-compute prop prefix to maintain monomorphic string operations
    const propPrefix = prop + DOT
    const propPrefixLen = propPrefix.length

    // V8 Optimization: Monomorphic function with consistent array operations
    const extractChildElements = (items: string[]) => {
      const result: string[] = []
      const itemsLen = items.length

      // V8 Optimization: Monomorphic loop with consistent array access
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

    // V8 Optimization: Use consistent object shape
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
    } as CustomSerializeOptions<U>
  }

  // V8 Optimization: Monomorphic function with consistent parameter shapes
  private static processEntity<T extends object>(
    prop: keyof T & string,
    entity: T,
    platform: Platform,
    options: CustomSerializeOptions<T>,
    parents: string[] = EMPTY_ARRAY
  ): T[keyof T] | undefined {
    // V8 Optimization: Use consistent array shape
    const parents_ =
      parents.length > 0
        ? [...parents, entity.constructor.name]
        : [entity.constructor.name]

    const child = Reference.unwrapReference(entity[prop] as T)
    const wrapped = helper(child)
    const populated =
      isPopulated(child, prop, options) && wrapped.isInitialized()
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

  // V8 Optimization: Monomorphic function with consistent parameter shapes
  private static processCollection<T extends object>(
    prop: keyof T & string,
    entity: T,
    options: CustomSerializeOptions<T>,
    parents: string[] = EMPTY_ARRAY
  ): T[keyof T] | undefined {
    // V8 Optimization: Use consistent array shape
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

    // V8 Optimization: Pre-compute child options to maintain monomorphic calls
    const childOptions = this.extractChildOptions(options, prop)

    // V8 Optimization: Monomorphic loop with consistent array access
    for (let i = 0; i < itemsLen; i++) {
      const item = items[i]
      if (isPopulated(item, prop, options)) {
        result[i] = this.serialize(item, childOptions, parents_)
      } else {
        result[i] = helper(item).getPrimaryKey()
      }
    }

    return result as unknown as T[keyof T]
  }
}

// V8 Optimization: Monomorphic function with consistent parameter shapes
export const mikroOrmSerializer = <TOutput extends object>(
  data: any,
  options?: Parameters<typeof EntitySerializer.serialize>[1] & {
    preventCircularRef?: boolean
    populate?: string[] | boolean
  }
): Promise<TOutput> => {
  return new Promise<TOutput>((resolve) => {
    // V8 Optimization: Use consistent object shape
    options ??= STATIC_OPTIONS_SHAPE

    // V8 Optimization: Use consistent array operations
    const data_ = (Array.isArray(data) ? data : [data]).filter(Boolean)

    // V8 Optimization: Pre-allocate arrays to maintain consistent shapes
    const forSerialization: unknown[] = []
    const notForSerialization: unknown[] = []

    // V8 Optimization: Monomorphic loop with consistent array access
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
      EntitySerializer.serialize(entity, {
        forceObject: true,
        populate: ["*"],
        preventCircularRef: true,
        ...options,
      } as CustomSerializeOptions<any>)
    ) as TOutput[]

    if (notForSerialization.length) {
      result = result.concat(notForSerialization)
    }

    resolve(Array.isArray(data) ? result : result[0])
  })
}
