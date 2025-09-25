import NodeCache from "node-cache"
import type { ICachingProviderService } from "@medusajs/framework/types"

export interface MemoryCacheModuleOptions {
  /**
   * TTL in seconds
   */
  ttl?: number
  /**
   * Maximum number of keys to store (see node-cache documentation)
   */
  maxKeys?: number
  /**
   * Check period for expired keys in seconds (see node-cache documentation)
   */
  checkPeriod?: number
  /**
   * Use clones for cached data (see node-cache documentation)
   */
  useClones?: boolean
}

export class MemoryCachingProvider implements ICachingProviderService {
  static identifier = "cache-memory"

  protected cacheClient: NodeCache
  protected tagIndex: Map<string, Set<string>> = new Map() // tag -> keys
  protected keyTags: Map<string, Set<string>> = new Map() // key -> tags
  protected entryOptions: Map<string, { noAutoInvalidation?: boolean }> =
    new Map() // key -> options
  protected options: MemoryCacheModuleOptions

  constructor() {
    this.options = {
      ttl: 3600,
      maxKeys: 25000,
      checkPeriod: 600, // 10 minutes
      useClones: false, // Default to false for speed, true would be slower but safer. we can discuss
    }

    const cacheClient = new NodeCache({
      stdTTL: this.options.ttl,
      maxKeys: this.options.maxKeys,
      checkperiod: this.options.checkPeriod,
      useClones: this.options.useClones,
    })

    this.cacheClient = cacheClient

    // Clean up tag indices when keys expire
    this.cacheClient.on("expired", (key: string, value: any) => {
      this.cleanupTagReferences(key)
    })

    this.cacheClient.on("del", (key: string, value: any) => {
      this.cleanupTagReferences(key)
    })
  }

  private cleanupTagReferences(key: string): void {
    const tags = this.keyTags.get(key)
    if (tags) {
      tags.forEach((tag) => {
        const keysForTag = this.tagIndex.get(tag)
        if (keysForTag) {
          keysForTag.delete(key)
          if (keysForTag.size === 0) {
            this.tagIndex.delete(tag)
          }
        }
      })
      this.keyTags.delete(key)
    }
    // Also clean up entry options
    this.entryOptions.delete(key)
  }

  async get({ key, tags }: { key?: string; tags?: string[] }): Promise<any> {
    if (key) {
      return this.cacheClient.get(key) ?? null
    }

    if (tags && tags.length > 0) {
      const allKeys = new Set<string>()

      tags.forEach((tag) => {
        const keysForTag = this.tagIndex.get(tag)
        if (keysForTag) {
          keysForTag.forEach((key) => allKeys.add(key))
        }
      })

      if (allKeys.size === 0) {
        return []
      }

      const results: any[] = []
      allKeys.forEach((key) => {
        const value = this.cacheClient.get(key)
        if (value !== undefined) {
          results.push(value)
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
      noAutoInvalidation?: boolean
    }
  }): Promise<void> {
    // Set the cache entry
    const effectiveTTL = ttl ?? this.options.ttl ?? 3600
    this.cacheClient.set(key, data, effectiveTTL)

    // Store entry options if provided
    if (options) {
      this.entryOptions.set(key, options)
    }

    // Handle tags if provided
    if (tags && tags.length > 0) {
      // Clean up any existing tag references for this key
      this.cleanupTagReferences(key)

      const tagSet = new Set(tags)
      this.keyTags.set(key, tagSet)

      // Add this key to each tag's index
      tags.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set())
        }
        this.tagIndex.get(tag)!.add(key)
      })
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
      noAutoInvalidation?: boolean
    }
  }): Promise<void> {
    if (key) {
      this.cacheClient.del(key)
      return
    }

    if (tags && tags.length > 0) {
      const allKeys = new Set<string>()

      tags.forEach((tag) => {
        const keysForTag = this.tagIndex.get(tag)
        if (keysForTag) {
          keysForTag.forEach((key) => allKeys.add(key))
        }
      })

      if (allKeys.size > 0) {
        // If clear method has noAutoInvalidation=false, respect individual entry settings
        // If clear method has noAutoInvalidation=true, force clear all keys
        const forceInvalidation = options?.noAutoInvalidation === false

        if (forceInvalidation) {
          // Force invalidation - clear all keys regardless of their individual settings
          this.cacheClient.del(Array.from(allKeys))
        } else {
          // Respect individual entry noAutoInvalidation settings
          const keysToDelete: string[] = []

          allKeys.forEach((key) => {
            const entryOptions = this.entryOptions.get(key)
            // Only delete if entry doesn't have noAutoInvalidation set to true
            if (!entryOptions?.noAutoInvalidation) {
              keysToDelete.push(key)
            }
          })

          if (keysToDelete.length > 0) {
            this.cacheClient.del(keysToDelete)
          }
        }
      }
    }
  }
}
