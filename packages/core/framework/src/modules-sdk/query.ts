import { Query } from "@medusajs/modules-sdk"
import { Cached } from "../caching"

function extractCacheOptions<T>(
  options: { cache?: Record<string, any> },
  key: string
) {
  return options.cache?.[key]
}

Cached<Query, "graph">({
  key: async (args, cachingModule) => {
    const queryOptions = args[0]
    const remoteJoinerOptions = args[1] ?? {}
    const { initialData, cache, ...restOptions } = remoteJoinerOptions

    const keyInput = {
      queryOptions,
      options: restOptions,
    }
    return await cachingModule.computeKey(keyInput)
  },
  enable: (args) => {
    return !!extractCacheOptions(args[1] ?? {}, "enable")
  },
  ttl: (args) => {
    return extractCacheOptions(args[1] ?? {}, "ttl")
  },
  tags: (args) => {
    return extractCacheOptions(args[1] ?? {}, "tags")
  },
  autoInvalidate: (args) => {
    return extractCacheOptions(args[1] ?? {}, "autoInvalidate")
  },
  providers: (args) => {
    return extractCacheOptions(args[1] ?? {}, "providers")
  },
})(
  Query.prototype,
  "graph",
  Object.getOwnPropertyDescriptor(Query.prototype, "graph")!
)

Cached<Query, "index">({
  key: async (args, cachingModule) => {
    const queryOptions = args[0]
    const remoteJoinerOptions = args[1] ?? {}
    const { initialData, cache, ...restOptions } = remoteJoinerOptions

    const keyInput = {
      queryOptions,
      options: restOptions,
    }
    return await cachingModule.computeKey(keyInput)
  },
  enable: (args) => {
    return !!extractCacheOptions(args[1] ?? {}, "enable")
  },
  ttl: (args) => {
    return extractCacheOptions(args[1] ?? {}, "ttl")
  },
  tags: (args) => {
    return extractCacheOptions(args[1] ?? {}, "tags")
  },
  autoInvalidate: (args) => {
    return extractCacheOptions(args[1] ?? {}, "autoInvalidate")
  },
  providers: (args) => {
    return extractCacheOptions(args[1] ?? {}, "providers")
  },
})(
  Query.prototype,
  "index",
  Object.getOwnPropertyDescriptor(Query.prototype, "index")!
)

export { Query }
