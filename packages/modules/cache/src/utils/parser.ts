import { ModuleJoinerConfig } from "@medusajs/framework/types"
import {
  GraphQLObjectType,
  GraphQLSchema,
  isListType,
  isNonNullType,
  isObjectType,
} from "graphql"

export interface EntityReference {
  type: string
  id: string | number
  field?: string
}

export interface InvalidationEvent {
  entityType: string
  entityId: string | number
  relatedEntities: EntityReference[]
  cacheKeys: string[]
}

export class CacheInvalidationParser {
  private typeMap: Map<string, GraphQLObjectType>
  private idPrefixToEntityName: Record<string, string>

  constructor(schema: GraphQLSchema, joinerConfigs: ModuleJoinerConfig[]) {
    this.typeMap = new Map()

    // Build type map for quick lookups
    const schemaTypeMap = schema.getTypeMap()
    Object.keys(schemaTypeMap).forEach((typeName) => {
      const type = schemaTypeMap[typeName]
      if (isObjectType(type) && !typeName.startsWith("__")) {
        this.typeMap.set(typeName, type)
      }
    })

    this.idPrefixToEntityName = joinerConfigs.reduce((acc, joinerConfig) => {
      if (joinerConfig.idPrefixToEntityName) {
        Object.entries(joinerConfig.idPrefixToEntityName).forEach(
          ([idPrefix, entityName]) => {
            acc[idPrefix] = entityName
          }
        )
      }
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Parse an object to identify entities and their relationships
   */
  parseObjectForEntities(obj: any, parentType?: string): EntityReference[] {
    const entities: EntityReference[] = []

    if (!obj || typeof obj !== "object") {
      return entities
    }

    // Check if this object matches any known GraphQL types
    const detectedType = this.detectEntityType(obj, parentType)
    if (detectedType && obj.id) {
      entities.push({
        type: detectedType,
        id: obj.id,
      })
    }

    // Recursively parse nested objects and arrays
    Object.keys(obj).forEach((key) => {
      const value = obj[key]

      if (Array.isArray(value)) {
        value.forEach((item) => {
          entities.push(
            ...this.parseObjectForEntities(
              item,
              this.getRelationshipType(detectedType, key)
            )
          )
        })
      } else if (value && typeof value === "object") {
        entities.push(
          ...this.parseObjectForEntities(
            value,
            this.getRelationshipType(detectedType, key)
          )
        )
      }
    })

    return entities
  }

  /**
   * Detect entity type based on object structure and GraphQL type map
   */
  private detectEntityType(obj: any, suggestedType?: string): string | null {
    if (obj.id) {
      const idParts = obj.id.split("_")
      if (idParts.length > 1 && this.idPrefixToEntityName[idParts[0]]) {
        this.idPrefixToEntityName[idParts[0]]
      }
    }

    if (suggestedType && this.typeMap.has(suggestedType)) {
      const type = this.typeMap.get(suggestedType)!
      if (this.objectMatchesType(obj, type)) {
        return suggestedType
      }
    }

    // Try to match against all known types
    for (const [typeName, type] of this.typeMap) {
      if (this.objectMatchesType(obj, type)) {
        return typeName
      }
    }

    return null
  }

  /**
   * Check if object structure matches GraphQL type fields
   */
  private objectMatchesType(obj: any, type: GraphQLObjectType): boolean {
    const fields = type.getFields()
    const objKeys = Object.keys(obj)

    // Must have id field for entities
    if (!obj.id || !fields.id) {
      return false
    }

    // Check if at least 50% of non-null object fields match type fields
    const matchingFields = objKeys.filter((key) => fields[key]).length
    return matchingFields >= Math.max(1, objKeys.length * 0.5)
  }

  /**
   * Get the expected type for a relationship field
   */
  private getRelationshipType(
    parentType: string | null,
    fieldName: string
  ): string | undefined {
    if (!parentType || !this.typeMap.has(parentType)) {
      return undefined
    }

    const type = this.typeMap.get(parentType)!
    const field = type.getFields()[fieldName]

    if (!field) {
      return undefined
    }

    let fieldType = field.type

    // Unwrap NonNull and List wrappers
    if (isNonNullType(fieldType)) {
      fieldType = fieldType.ofType
    }
    if (isListType(fieldType)) {
      fieldType = fieldType.ofType
    }
    if (isNonNullType(fieldType)) {
      fieldType = fieldType.ofType
    }

    if (isObjectType(fieldType)) {
      return fieldType.name
    }

    return undefined
  }

  /**
   * Build invalidation events based on parsed entities
   */
  buildInvalidationEvents(
    entities: EntityReference[],
    cacheKey: string,
    operation: "created" | "updated" | "deleted" = "updated"
  ): InvalidationEvent[] {
    const events: InvalidationEvent[] = []
    const processedEntities = new Set<string>()

    entities.forEach((entity) => {
      const entityKey = `${entity.type}:${entity.id}`

      if (processedEntities.has(entityKey)) {
        return
      }
      processedEntities.add(entityKey)

      // Get related entities for this entity type
      const relatedEntities = entities.filter(
        (e) => e.type !== entity.type || e.id !== entity.id
      )

      // Build cache keys that might be affected
      const affectedKeys = this.buildAffectedCacheKeys(
        entity,
        relatedEntities,
        cacheKey,
        operation
      )

      events.push({
        entityType: entity.type,
        entityId: entity.id,
        relatedEntities,
        cacheKeys: affectedKeys,
      })
    })

    return events
  }

  /**
   * Build list of cache keys that should be invalidated
   */
  private buildAffectedCacheKeys(
    entity: EntityReference,
    relatedEntities: EntityReference[],
    originalKey: string,
    operation: "created" | "updated" | "deleted" = "updated"
  ): string[] {
    const keys = new Set<string>([originalKey])

    // Add keys based on entity type and ID
    keys.add(`${entity.type}:${entity.id}`)
    keys.add(`${entity.type}:*`)
    keys.add(`*:${entity.id}`)

    // Add keys for related entities
    relatedEntities.forEach((related) => {
      keys.add(`${entity.type}:${entity.id}:${related.type}:${related.id}`)
      keys.add(`${related.type}:${related.id}:${entity.type}:${entity.id}`)
    })

    // Always add collection keys since entity changes can impact collections
    keys.add(`${entity.type}:collection`)
    keys.add(`${entity.type}:list:*`)

    // Add operation-specific keys
    keys.add(`${entity.type}:${operation}`)
    keys.add(`${entity.type}:${entity.id}:${operation}`)

    // For delete operations, also invalidate existence checks
    if (operation === "deleted") {
      keys.add(`${entity.type}:exists:${entity.id}`)
      keys.add(`${entity.type}:active:*`)
    }

    // For create operations, invalidate count caches
    if (operation === "created") {
      keys.add(`${entity.type}:count`)
      keys.add(`${entity.type}:total:*`)
    }

    return Array.from(keys)
  }

  /**
   * Generate event name for cache invalidation
   */
  generateInvalidationEventName(
    entityType: string,
    operation: "created" | "updated" | "deleted" = "updated"
  ): string {
    return `cache.invalidate.${entityType}.${operation}`
  }
}
