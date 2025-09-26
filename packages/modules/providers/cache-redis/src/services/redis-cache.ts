import { Redis } from "ioredis"
import { RedisCacheModuleOptions } from "@types"

export class RedisCachingProvider {
  static identifier = "cache-redis"

  protected redisClient: Redis
  protected keyNamePrefix: string
  protected defaultTTL: number

  constructor(
    { redisClient, prefix }: { redisClient: Redis; prefix: string },
    options?: RedisCacheModuleOptions
  ) {
    this.redisClient = redisClient
    this.keyNamePrefix = prefix
    this.defaultTTL = options?.ttl ?? 3600 // 1 hour default
  }

  #getKeyName(key: string): string {
    return `${this.keyNamePrefix}${key}`
  }

  #getTagKey(tag: string): string {
    return `${this.keyNamePrefix}tag:${tag}`
  }

  #getOptionsKey(key: string): string {
    return `${this.keyNamePrefix}options:${key}`
  }

  async get({ key, tags }: { key?: string; tags?: string[] }): Promise<any> {
    if (key) {
      const keyName = this.#getKeyName(key)
      const result = await this.redisClient.get(keyName)
      return result ? JSON.parse(result) : null
    }

    if (tags && tags.length) {
      // Get all keys associated with the tags
      const pipeline = this.redisClient.pipeline()
      tags.forEach((tag) => {
        const tagKey = this.#getTagKey(tag)
        pipeline.smembers(tagKey)
      })

      const tagResults = await pipeline.exec()
      const allKeys = new Set<string>()

      tagResults?.forEach((result, index) => {
        if (result && result[1]) {
          ;(result[1] as string[]).forEach((key) => allKeys.add(key))
        }
      })

      if (allKeys.size === 0) {
        return []
      }

      // Get all values for the keys
      const valuePipeline = this.redisClient.pipeline()
      Array.from(allKeys).forEach((key) => {
        valuePipeline.get(key)
      })

      const valueResults = await valuePipeline.exec()
      const results: any[] = []

      valueResults?.forEach((result, index) => {
        if (result && result[1]) {
          try {
            results.push(JSON.parse(result[1] as string))
          } catch (e) {
            // Skip invalid JSON
          }
        }
      })

      return results
    }

    return null
  }

  async set({
    key,
    data,
    ttl,
    tags,
    options,
  }: {
    key: string
    data: object
    ttl?: number
    tags?: string[]
    options?: {
      autoInvalidate?: boolean
    }
  }): Promise<void> {
    const keyName = this.#getKeyName(key)
    const serializedData = JSON.stringify(data)
    const effectiveTTL = ttl ?? this.defaultTTL

    // Set the main cache entry
    if (effectiveTTL) {
      await this.redisClient.setex(keyName, effectiveTTL, serializedData)
    } else {
      await this.redisClient.set(keyName, serializedData)
    }

    // Handle tags if provided
    if (tags && tags.length) {
      const pipeline = this.redisClient.pipeline()

      tags.forEach((tag) => {
        const tagKey = this.#getTagKey(tag)

        pipeline.sadd(tagKey, keyName)

        // Set TTL for tag keys too (slightly longer than cache TTL)
        if (effectiveTTL) {
          pipeline.expire(tagKey, effectiveTTL + 60) // +1 minute buffer
        }
      })

      await pipeline.exec()
    }

    // Store options if provided
    if (
      Object.keys(options ?? {}).length &&
      !Object.values(options ?? {}).every((value) => value === undefined)
    ) {
      const optionsKey = this.#getOptionsKey(key)
      const optionsData = JSON.stringify(options!)

      if (effectiveTTL) {
        await this.redisClient.setex(optionsKey, effectiveTTL + 60, optionsData) // +1 minute buffer
      } else {
        await this.redisClient.set(optionsKey, optionsData)
      }
    }
  }

  async clear({
    key,
    tags,
    options,
  }: {
    key?: string
    tags?: string[]
    options?: {
      autoInvalidate?: boolean
    }
  }): Promise<void> {
    if (key) {
      const keyName = this.#getKeyName(key)
      const optionsKey = this.#getOptionsKey(key)
      await this.redisClient.del(keyName, optionsKey)
      return
    }

    if (tags && tags.length) {
      // Handle wildcard tag to clear all cache data
      if (tags.includes("*")) {
        await this.flush()
        return
      }

      // Get all keys associated with the tags

      const pipeline = this.redisClient.pipeline()
      tags.forEach((tag) => {
        const tagKey = this.#getTagKey(tag)

        pipeline.smembers(tagKey)
      })

      const tagResults = await pipeline.exec()

      const allKeys = new Set<string>()

      tagResults?.forEach((result, index) => {
        if (result && result[1]) {
          ;(result[1] as string[]).forEach((key) => allKeys.add(key))
        }
      })

      if (allKeys.size) {
        // If no options provided (user explicit call), clear everything
        if (!options) {
          const deletePipeline = this.redisClient.pipeline()

          Array.from(allKeys).forEach((key) => {
            const optionsKey = this.#getOptionsKey(
              key.replace(this.keyNamePrefix, "")
            )
            deletePipeline.del(key, optionsKey)
          })

          // Find and delete ALL tags that reference the deleted keys
          const allTagKeys = await this.redisClient.keys(
            `${this.keyNamePrefix}tag:*`
          )

          if (allTagKeys.length) {
            allTagKeys.forEach((tagKey) => {
              Array.from(allKeys).forEach((key) => {
                deletePipeline.srem(tagKey, key)
              })
            })

            // Check which tag sets are empty and delete them
            const cardinalityPipeline = this.redisClient.pipeline()
            allTagKeys.forEach((tagKey) => {
              cardinalityPipeline.scard(tagKey)
            })

            await deletePipeline.exec()
            const cardinalityResults = await cardinalityPipeline.exec()

            // Delete empty tag keys
            const emptyTagPipeline = this.redisClient.pipeline()
            cardinalityResults?.forEach((result, index) => {
              if (result && result[1] === 0) {
                emptyTagPipeline.del(allTagKeys[index])
              }
            })

            await emptyTagPipeline.exec()
          } else {
            await deletePipeline.exec()
          }
          return
        }

        // If autoInvalidate is true (strategy call), only clear entries with autoInvalidate=true (default)
        if (options.autoInvalidate === true) {
          const optionsPipeline = this.redisClient.pipeline()

          Array.from(allKeys).forEach((key) => {
            const optionsKey = this.#getOptionsKey(
              key.replace(this.keyNamePrefix, "")
            )
            optionsPipeline.get(optionsKey)
          })

          const optionsResults = await optionsPipeline.exec()
          const keysToDelete: string[] = []

          Array.from(allKeys).forEach((key, index) => {
            const optionsResult = optionsResults?.[index]

            if (optionsResult && optionsResult[1]) {
              try {
                const entryOptions = JSON.parse(optionsResult[1] as string)

                // Delete if entry has autoInvalidate=true or no setting (default true)
                const shouldAutoInvalidate = entryOptions.autoInvalidate ?? true

                if (shouldAutoInvalidate) {
                  keysToDelete.push(key)
                }
              } catch (e) {
                // If can't parse options, assume it's safe to delete (default true)
                keysToDelete.push(key)
              }
            } else {
              // No options stored, default to true
              keysToDelete.push(key)
            }
          })

          if (keysToDelete.length) {
            const deletePipeline = this.redisClient.pipeline()

            keysToDelete.forEach((key) => {
              const optionsKey = this.#getOptionsKey(
                key.replace(this.keyNamePrefix, "")
              )

              deletePipeline.del(key, optionsKey)
            })

            // Find and delete ALL tags that reference the deleted keys
            // We need to scan for all tag keys and remove references to deleted keys
            const allTagKeys = await this.redisClient.keys(
              `${this.keyNamePrefix}tag:*`
            )

            if (allTagKeys.length) {
              const cleanupPipeline = this.redisClient.pipeline()

              allTagKeys.forEach((tagKey) => {
                keysToDelete.forEach((key) => {
                  cleanupPipeline.srem(tagKey, key)
                })
              })

              // Remove empty tag sets
              allTagKeys.forEach((tagKey) => {
                cleanupPipeline.scard(tagKey)
              })

              const cardinalityResults = await cleanupPipeline.exec()

              // Delete tag keys that are now empty
              const emptyTagDeletePipeline = this.redisClient.pipeline()
              cardinalityResults?.forEach((result, index) => {
                if (result && result[1] === 0) {
                  emptyTagDeletePipeline.del(allTagKeys[index])
                }
              })

              await emptyTagDeletePipeline.exec()
            }

            await deletePipeline.exec()

            return
          }
        }
      }
    }
  }

  async flush(): Promise<void> {
    // Use SCAN to find ALL keys with our prefix and delete them
    // This includes main cache keys, tag keys (tag:*), and option keys (options:*)
    const pattern = `${this.keyNamePrefix}*`
    let cursor = "0"

    do {
      const result = await this.redisClient.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        1000
      )
      cursor = result[0]
      const keys = result[1]

      if (keys.length) {
        await this.redisClient.del(...keys)
      }
    } while (cursor !== "0")
  }
}
