import { RedisCacheModuleOptions } from "@types"
import { Redis } from "ioredis"
import { createGunzip, createGzip } from "zlib"

export class RedisCachingProvider {
  static identifier = "cache-redis"

  protected redisClient: Redis
  protected keyNamePrefix: string
  protected defaultTTL: number
  protected compressionThreshold: number
  protected hasher: (key: string) => string

  constructor(
    {
      redisClient,
      prefix,
      hasher,
    }: { redisClient: Redis; prefix: string; hasher: (key: string) => string },
    options?: RedisCacheModuleOptions
  ) {
    this.redisClient = redisClient
    this.keyNamePrefix = prefix
    this.defaultTTL = options?.ttl ?? 3600 // 1 hour default
    this.compressionThreshold = options?.compressionThreshold ?? 1024 // 1KB default
    this.hasher = hasher
  }

  #getKeyName(key: string): string {
    return `${this.keyNamePrefix}${key}`
  }

  #getTagKey(tag: string): string {
    return `${this.keyNamePrefix}tag:${this.hasher(tag)}`
  }

  #getTagsKey(key: string): string {
    return `${this.keyNamePrefix}tags:${key}`
  }

  async #compressData(data: string): Promise<Buffer> {
    if (data.length <= this.compressionThreshold) {
      const buffer = Buffer.from(data, "utf8")
      const prefix = Buffer.from([0]) // 0 = uncompressed
      return Buffer.concat([prefix, buffer])
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const gzip = createGzip()

      gzip.on("data", (chunk) => chunks.push(chunk))
      gzip.on("end", () => {
        const compressedBuffer = Buffer.concat(chunks)
        const prefix = Buffer.from([1]) // 1 = compressed
        resolve(Buffer.concat([prefix, compressedBuffer]))
      })
      gzip.on("error", (error) => {
        const buffer = Buffer.from(data, "utf8")
        const prefix = Buffer.from([0])
        resolve(Buffer.concat([prefix, buffer]))
      })

      gzip.write(data, "utf8")
      gzip.end()
    })
  }

  async #decompressData(buffer: Buffer): Promise<string> {
    if (buffer.length === 0) {
      return ""
    }

    const formatByte = buffer[0]
    const dataBuffer = buffer.subarray(1)

    if (formatByte === 0) {
      // Uncompressed
      return dataBuffer.toString("utf8")
    }

    if (formatByte === 1) {
      // Compressed with gzip
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const gunzip = createGunzip()

        gunzip.on("data", (chunk) => chunks.push(chunk))
        gunzip.on("end", () => {
          const decompressed = Buffer.concat(chunks).toString("utf8")
          resolve(decompressed)
        })
        gunzip.on("error", (error) => {
          // Fallback: return as-is if decompression fails
          resolve(dataBuffer.toString("utf8"))
        })

        gunzip.write(dataBuffer)
        gunzip.end()
      })
    }

    // Unknown format, return as UTF-8
    return buffer.toString("utf8")
  }

  async get({ key, tags }: { key?: string; tags?: string[] }): Promise<any> {
    if (key) {
      const keyName = this.#getKeyName(key)
      const buffer = await this.redisClient.hgetBuffer(keyName, "data")
      if (!buffer) {
        return null
      }

      const finalData = await this.#decompressData(buffer)
      return JSON.parse(finalData)
    }

    if (tags?.length) {
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

      // Get all hash data for the keys
      const valuePipeline = this.redisClient.pipeline()
      Array.from(allKeys).forEach((key) => {
        valuePipeline.hgetBuffer(key, "data")
      })

      const valueResults = await valuePipeline.exec()
      const results: any[] = []

      for (const result of valueResults || []) {
        if (result && result[1]) {
          const buffer = result[1] as Buffer

          try {
            const finalData = await this.#decompressData(buffer)
            results.push(JSON.parse(finalData))
          } catch (e) {
            // If JSON parsing fails, skip this entry (corrupted data)
            console.warn(`Skipping corrupted cache entry: ${e.message}`)
          }
        }
      }

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

    const finalData = await this.#compressData(serializedData)

    const hashData: Record<string, string | Buffer> = {
      data: finalData,
    }

    if (options && Object.keys(options).length) {
      hashData.options = JSON.stringify(options)
    }

    await this.redisClient.hset(keyName, hashData)
    if (effectiveTTL) {
      await this.redisClient.expire(keyName, effectiveTTL)
    }

    // Store tags in a separate key for inverted index lookup
    if (tags && tags.length) {
      const tagsKey = this.#getTagsKey(key)
      const tagsJson = JSON.stringify(tags)
      const finalTagsData = await this.#compressData(tagsJson)

      if (effectiveTTL) {
        await this.redisClient.setex(tagsKey, effectiveTTL + 60, finalTagsData) // +1 minute buffer
      } else {
        await this.redisClient.set(tagsKey, finalTagsData)
      }
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

      // Get tags for this key to clean up tag sets
      const tagsKey = this.#getTagsKey(key)
      const tagsBuffer = await this.redisClient.getBuffer(tagsKey)

      if (tagsBuffer) {
        try {
          const finalTagsData = await this.#decompressData(tagsBuffer)
          const entryTags: string[] = JSON.parse(finalTagsData)

          // Remove this key from all its tag sets
          if (entryTags.length) {
            const tagCleanupPipeline = this.redisClient.pipeline()
            entryTags.forEach((tag) => {
              const tagKey = this.#getTagKey(tag)
              tagCleanupPipeline.srem(tagKey, keyName)
            })
            // Also delete the tags key
            tagCleanupPipeline.unlink(tagsKey)
            await tagCleanupPipeline.exec()
          }
        } catch (e) {
          // noop - corrupted tag data, skip cleanup
        }
      }

      await this.redisClient.unlink(keyName)
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

          // Delete main keys and options
          Array.from(allKeys).forEach((key) => {
            deletePipeline.unlink(key)
          })

          // Clean up tag references for each key
          const tagDataPromises = Array.from(allKeys).map(async (key) => {
            const keyWithoutPrefix = key.replace(this.keyNamePrefix, "")
            const tagsKey = this.#getTagsKey(keyWithoutPrefix)
            const tagsData = await this.redisClient.getBuffer(tagsKey)
            return { key, tagsKey, tagsData }
          })

          const tagResults = await Promise.all(tagDataPromises)

          // Build single pipeline for all tag cleanup operations
          const tagCleanupPipeline = this.redisClient.pipeline()
          const cleanupPromises = tagResults.map(
            async ({ key, tagsKey, tagsData }) => {
              if (tagsData) {
                try {
                  const finalTagsData = await this.#decompressData(tagsData)
                  const entryTags: string[] = JSON.parse(finalTagsData)

                  if (entryTags.length) {
                    entryTags.forEach((tag) => {
                      const tagKey = this.#getTagKey(tag)
                      tagCleanupPipeline.srem(tagKey, key)
                    })
                    tagCleanupPipeline.unlink(tagsKey)
                  }
                } catch (e) {
                  // noop
                }
              }
            }
          )

          await Promise.all(cleanupPromises)
          await tagCleanupPipeline.exec()
          await deletePipeline.exec()

          // Clean up empty tag sets
          const allTagKeys = await this.redisClient.keys(
            `${this.keyNamePrefix}tag:*`
          )
          if (allTagKeys.length) {
            const cardinalityPipeline = this.redisClient.pipeline()
            allTagKeys.forEach((tagKey) => {
              cardinalityPipeline.scard(tagKey)
            })

            const cardinalityResults = await cardinalityPipeline.exec()

            // Delete empty tag keys
            const emptyTagPipeline = this.redisClient.pipeline()
            cardinalityResults?.forEach((result, index) => {
              if (result && result[1] === 0) {
                emptyTagPipeline.unlink(allTagKeys[index])
              }
            })

            await emptyTagPipeline.exec()
          }

          return
        }

        // If autoInvalidate is true (strategy call), only clear entries with autoInvalidate=true (default)
        if (options.autoInvalidate === true) {
          const optionsPipeline = this.redisClient.pipeline()

          Array.from(allKeys).forEach((key) => {
            optionsPipeline.hget(key, "options")
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
              deletePipeline.unlink(key)
            })

            // Clean up tag references for each key to delete
            const tagDataPromises = keysToDelete.map(async (key) => {
              const keyWithoutPrefix = key.replace(this.keyNamePrefix, "")
              const tagsKey = this.#getTagsKey(keyWithoutPrefix)
              const tagsData = await this.redisClient.getBuffer(tagsKey)
              return { key, tagsKey, tagsData }
            })

            // Wait for all tag data fetches
            const tagResults = await Promise.all(tagDataPromises)

            // Build single pipeline for all tag cleanup operations
            const tagCleanupPipeline = this.redisClient.pipeline()

            const cleanupPromises = tagResults.map(
              async ({ key, tagsKey, tagsData }) => {
                if (tagsData) {
                  try {
                    const finalTagsData = await this.#decompressData(tagsData)
                    const entryTags: string[] = JSON.parse(finalTagsData)

                    if (entryTags.length) {
                      entryTags.forEach((tag) => {
                        const tagKey = this.#getTagKey(tag)
                        tagCleanupPipeline.srem(tagKey, key)
                      })
                      tagCleanupPipeline.unlink(tagsKey) // Delete the tags key
                    }
                  } catch (e) {
                    // noop
                  }
                }
              }
            )

            await Promise.all(cleanupPromises)
            await tagCleanupPipeline.exec()

            await deletePipeline.exec()

            // Clean up empty tag sets
            const allTagKeys = await this.redisClient.keys(
              `${this.keyNamePrefix}tag:*`
            )
            if (allTagKeys.length) {
              const cleanupPipeline = this.redisClient.pipeline()

              allTagKeys.forEach((tagKey) => {
                cleanupPipeline.scard(tagKey)
              })

              const cardinalityResults = await cleanupPipeline.exec()

              // Delete tag keys that are now empty
              const emptyTagDeletePipeline = this.redisClient.pipeline()
              cardinalityResults?.forEach((result, index) => {
                if (result && result[1] === 0) {
                  emptyTagDeletePipeline.unlink(allTagKeys[index])
                }
              })

              await emptyTagDeletePipeline.exec()
            }

            return
          }
        }
      }
    }
  }

  async flush(): Promise<void> {
    // Use SCAN to find ALL keys with our prefix and delete them
    // This includes main cache keys, tag keys (tag:*), and tags keys (tags:*)
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
        await this.redisClient.unlink(...keys)
      }
    } while (cursor !== "0")
  }
}
