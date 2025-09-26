import type {
  Event,
  ICachingModuleService,
  ICachingStrategy,
  ModuleJoinerConfig,
} from "@medusajs/framework/types"
import {
  type GraphQLSchema,
  Modules,
  toCamelCase,
  upperCaseFirst,
} from "@medusajs/framework/utils"
import { type CachingModuleService } from "@services"
import type { ModuleInjectedDependencies } from "@types"
import crypto from "crypto"
import stringify from "fast-json-stable-stringify"
import { CacheInvalidationParser, EntityReference } from "./parser"

export function objectHash(input: any): string {
  const str = stringify(input)
  return crypto.createHash("sha1").update(str).digest("hex")
}

export class DefaultCacheStrategy implements ICachingStrategy {
  #cacheInvalidationParser: CacheInvalidationParser
  #cacheModule: ICachingModuleService
  #container: ModuleInjectedDependencies

  constructor(
    container: ModuleInjectedDependencies,
    cacheModule: CachingModuleService
  ) {
    this.#cacheModule = cacheModule
    this.#container = container
  }

  async onApplicationStart(
    schema: GraphQLSchema,
    joinerConfigs: ModuleJoinerConfig[]
  ) {
    this.#cacheInvalidationParser = new CacheInvalidationParser(
      schema,
      joinerConfigs
    )

    const eventBus = this.#container[Modules.EVENT_BUS]

    eventBus.subscribe("*", async (data: Event) => {
      try {
        // We dont have to await anything here and the rest can be done in the background
        return
      } finally {
        const eventName = data.name
        const operation = eventName.split(".").pop() as
          | "created"
          | "updated"
          | "deleted"
        const entityType = eventName.split(".").slice(-2).shift()!

        const eventData = data.data as
          | { id: string | string[] }
          | { id: string | string[] }[]

        // We expect event data to be either { id: string | string[] } or { id: string | string[] }[]
        if (Array.isArray(eventData)) {
          for (const item of eventData) {
            const ids = Array.isArray(item.id) ? item.id : [item.id]
            const tags: string[] = []
            for (const id of ids) {
              const entityReference: EntityReference = {
                type: upperCaseFirst(toCamelCase(entityType)),
                id,
              }

              const tags_ = await this.computeTags(item, {
                entities: [entityReference],
                operation,
              })
              tags.push(...tags_)
            }

            await this.#cacheModule.clear({
              tags,
              options: { autoInvalidate: true },
            })
          }
        } else {
          const ids = Array.isArray(eventData.id)
            ? eventData.id
            : [eventData.id]
          const tags: string[] = []
          for (const id of ids) {
            const entityReference: EntityReference = {
              type: upperCaseFirst(toCamelCase(entityType)),
              id,
            }

            const tags_ = await this.computeTags(eventData, {
              entities: [entityReference],
              operation,
            })

            tags.push(...tags_)
          }

          await this.#cacheModule.clear({
            tags,
            options: { autoInvalidate: true },
          })
        }
      }
    })
  }

  async computeKey(input: object) {
    return objectHash(input)
  }

  async computeTags(
    input: object,
    options?: {
      entities?: EntityReference[]
      operation?: "created" | "updated" | "deleted"
    }
  ): Promise<string[]> {
    // Parse the input object to identify entities
    const entities_ =
      options?.entities ||
      this.#cacheInvalidationParser.parseObjectForEntities(input)

    if (entities_.length === 0) {
      return []
    }

    // Generate cache key for this input
    const cacheKey = await this.computeKey(input)

    // Build invalidation events to get comprehensive cache keys
    const events = this.#cacheInvalidationParser.buildInvalidationEvents(
      entities_,
      cacheKey,
      options?.operation
    )

    // Collect all unique cache keys from all events as tags
    const tags = new Set<string>()

    events.forEach((event) => {
      event.cacheKeys.forEach((key) => tags.add(key))

      // Also add entity-specific tags
      tags.add(`${event.entityType}:${event.entityId}`)
      tags.add(`${event.entityType}:list:*`)
    })

    return Array.from(tags)
  }
}
