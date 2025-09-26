import { Modules } from "@medusajs/utils"
import { container } from "../container"

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

  if (!cachingModule) {
    throw new Error(
      "Caching module not found. The caching module must be configured in your medusa config.."
    )
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

export function cached(options: {
  key?: string | ((...args: any[]) => string | Promise<string>)
  tags?: string[] | ((...args: any[]) => string[] | Promise<string[]>)
  ttl?: number
  autoInvalidate?: boolean
  providers?: string[]
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    if (typeof originalMethod !== "function") {
      throw new Error("@cached can only be applied to methods")
    }

    descriptor.value = async function (...args: any[]) {
      // Resolve dynamic options
      const resolvedKey =
        typeof options.key === "function"
          ? await options.key(...args)
          : options.key

      const resolvedTags =
        typeof options.tags === "function"
          ? await options.tags(...args)
          : options.tags

      // Create cache options
      const cacheOptions = {
        key: resolvedKey,
        tags: resolvedTags,
        ttl: options.ttl,
        autoInvalidate: options.autoInvalidate,
        providers: options.providers,
      }

      // Use the existing useCache function with the original method bound to this context
      return await useCache(
        () => originalMethod.apply(this, args),
        cacheOptions
      )
    }

    return descriptor
  }
}
