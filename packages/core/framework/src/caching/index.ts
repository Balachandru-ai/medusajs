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
