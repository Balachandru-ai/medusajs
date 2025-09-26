import { FeatureFlag, Modules } from "../utils"
import { container } from "../container"
import type { ICachingModuleService } from "../types"

/**
 * This function is used to cache the result of a function call.
 *
 * @param cb - The callback to execute.
 * @param options - The options for the cache.
 * @returns The result of the callback.
 */
export async function useCache<T>(
  cb: (...args: any[]) => Promise<T>,
  options: {
    key?: string
    tags?: string[]
    ttl?: number
    /**
     * Whethere the default strategy should auto invalidate the cache whenever it is possible.
     */
    autoInvalidate?: boolean
    providers?: string[]
  }
): Promise<T> {
  const cachingModule = container.resolve(Modules.CACHING, {
    allowUnregistered: true,
  })

  if (!FeatureFlag.isFeatureEnabled("cachhing") || !cachingModule) {
    return await cb()
  }

  const key = options.key ?? (await cachingModule.computeKey(options))

  const data = await cachingModule.get({
    key,
    tags: options.tags,
    providers: options.providers,
  })

  if (data) {
    return data as T
  }

  const result = await cb()

  await cachingModule.set({
    key,
    tags: options.tags,
    ttl: options.ttl,
    data: result as object,
    options: { autoInvalidate: options.autoInvalidate },
    providers: options.providers,
  })

  return result
}

type TargetMethodArgs<Target, PropertyKey> = Target[PropertyKey &
  keyof Target] extends (...args: any[]) => any
  ? Parameters<Target[PropertyKey & keyof Target]>
  : never

/**
 * This function is used to cache the result of a method call.
 *
 * @param options - The options for the cache.
 * @returns The original method with the cache applied.
 */
export function Cached<
  const Target extends object,
  const PropertyKey extends keyof Target
>(options: {
  /**
   * The key to use for the cache.
   * If a function is provided, it will be called with the arguments as the first argument and the
   * container as the second argument.
   */
  key?:
    | string
    | ((
        args: TargetMethodArgs<Target, PropertyKey>,
        cachingModule: ICachingModuleService
      ) => string | Promise<string>)
  /**
   * Whether to enable the cache. This is only useful if you want to enable without providing any
   * other options.
   */
  enable?:
    | boolean
    | ((args: TargetMethodArgs<Target, PropertyKey>) => boolean | undefined)
  /**
   * The tags to use for the cache.
   */
  tags?:
    | string[]
    | ((args: TargetMethodArgs<Target, PropertyKey>) => string[] | undefined)
  /**
   * The time-to-live (TTL) value in seconds.
   */
  ttl?:
    | number
    | ((args: TargetMethodArgs<Target, PropertyKey>) => number | undefined)
  /**
   * Whether to auto invalidate the cache whenever it is possible.
   */
  autoInvalidate?:
    | boolean
    | ((args: TargetMethodArgs<Target, PropertyKey>) => boolean | undefined)
  /**
   * The providers to use for the cache.
   */
  providers?:
    | string[]
    | ((args: TargetMethodArgs<Target, PropertyKey>) => string[] | undefined)
}) {
  return function (
    target: Target,
    propertyKey: PropertyKey,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    if (typeof originalMethod !== "function") {
      throw new Error("@cached can only be applied to methods")
    }

    const cachingModule = container.resolve(Modules.CACHING, {
      allowUnregistered: true,
    })

    descriptor.value = async function (
      ...args: Target[PropertyKey & keyof Target] extends (
        ...args: any[]
      ) => any
        ? Parameters<Target[PropertyKey & keyof Target]>
        : never
    ) {
      if (!FeatureFlag.isFeatureEnabled("cachhing") || !cachingModule) {
        return await originalMethod.apply(this, args)
      }

      const cacheOptions = await [
        "key",
        "tags",
        "ttl",
        "autoInvalidate",
        "providers",
      ].reduce(async (acc, option) => {
        const resolvedOption =
          typeof options[option] === "function"
            ? await options[option](args)
            : options[option]
        acc[option] = resolvedOption
        return acc
      }, {})

      return await useCache(
        () => originalMethod.apply(this, args),
        cacheOptions
      )
    }

    return descriptor
  }
}
