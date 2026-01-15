import { MedusaModule } from "@medusajs/modules-sdk"
import { MedusaContainer } from "@medusajs/types"
import { GraphQLUtils, toSnakeCase } from "@medusajs/utils"
import { hasPermission } from "../../../policies/has-permission"

/**
 * Base GraphQL schema with common scalars
 */
const baseGraphqlSchema = `
    scalar DateTime
    scalar Date
    scalar Time
    scalar JSON
`

// Cache for the schema to avoid re-parsing the GraphQL
let cachedSchema: GraphQLUtils.GraphQLSchema | null = null

/**
 * Makes a GraphQL schema executable
 */
function makeSchemaExecutable(inputSchema: string) {
  const { schema: cleanedSchema } = GraphQLUtils.cleanGraphQLSchema(inputSchema)

  if (!cleanedSchema) {
    return
  }

  return GraphQLUtils.makeExecutableSchema({
    typeDefs: cleanedSchema,
  })
}

function getExecutableSchema(): GraphQLUtils.GraphQLSchema | null {
  if (cachedSchema) {
    return cachedSchema
  }

  cachedSchema = buildExecutableSchema()
  return cachedSchema
}

/**
 * Gets services entity map from joiner configs
 */
function getServicesEntityMap(moduleJoinerConfigs: any[]): Record<string, any> {
  const servicesEntityMap: Record<string, any> = {}

  for (const config of moduleJoinerConfigs) {
    if (!config?.serviceName || !config?.schema) {
      continue
    }

    const schema = makeSchemaExecutable(config.schema)
    if (!schema) {
      continue
    }

    const entitiesMap = schema.getTypeMap()
    Object.entries(entitiesMap).forEach(([entityName, entityValue]) => {
      const entity = entityValue as any

      if (
        entity.astNode &&
        entity.astNode.kind === GraphQLUtils.Kind.OBJECT_TYPE_DEFINITION &&
        !entityName.startsWith("__") &&
        !["Query", "Mutation", "Subscription"].includes(entityName)
      ) {
        servicesEntityMap[entityName] = entity
      }
    })
  }

  return servicesEntityMap
}

/**
 * Builds schema from filterable links
 */
function buildSchemaFromFilterableLinks(
  moduleJoinerConfigs: any[],
  servicesEntityMap: Record<string, any>
): string {
  const schemaParts: string[] = []

  for (const config of moduleJoinerConfigs) {
    if (!config?.schema) {
      continue
    }

    schemaParts.push(config.schema)
  }

  return schemaParts.join("\n")
}

/**
 * Builds executable schema from all joiner configs
 */
function buildExecutableSchema(): GraphQLUtils.GraphQLSchema | null {
  try {
    const moduleJoinerConfigs = MedusaModule.getAllJoinerConfigs()
    const servicesEntityMap = getServicesEntityMap(moduleJoinerConfigs)
    const filterableEntities = buildSchemaFromFilterableLinks(
      moduleJoinerConfigs,
      servicesEntityMap
    )

    const augmentedSchema = baseGraphqlSchema + "\n" + filterableEntities
    const executableSchema = makeSchemaExecutable(augmentedSchema)

    return executableSchema || null
  } catch (error) {
    console.warn(
      "Failed to build executable schema for RBAC field filtering:",
      error
    )
    return null
  }
}

/**
 * Gets the actual GraphQL entity name from a field path
 * e.g., "product.variants" -> "ProductVariant" (from GraphQL schema)
 */
function getActualEntityName(fieldPath: string): string | null {
  const schema = getExecutableSchema()
  if (!schema) {
    return null
  }

  const entitiesMap = schema.getTypeMap()
  const parts = fieldPath.split(".")

  // Start with the base entity
  let currentEntityName = parts[0]
  let currentEntity = entitiesMap[currentEntityName] as any

  if (!currentEntity) {
    return null
  }

  // Navigate through the field path to get the final entity
  for (let i = 1; i < parts.length; i++) {
    const fieldName = parts[i]

    if (!currentEntity.getFields) {
      return null
    }

    const fields = currentEntity.getFields()
    const field = fields[fieldName]

    if (!field || !field.type) {
      return null
    }

    // Get the base type name (unwrap non-null and list types)
    let fieldType = field.type
    while (fieldType.ofType) {
      fieldType = fieldType.ofType
    }

    currentEntityName = fieldType.name
    currentEntity = entitiesMap[currentEntityName] as any

    if (!currentEntity) {
      return null
    }
  }

  return currentEntityName
}

/**
 * Gets the normalized snake_case entity name for policy comparison
 * e.g., "product.variants" -> "product_variant"
 */
function getNormalizedEntityName(fieldPath: string): string | null {
  const actualEntityName = getActualEntityName(fieldPath)
  if (!actualEntityName) {
    return null
  }

  return toSnakeCase(actualEntityName)
}

/**
 * Checks policies against fields and returns not allowed fields
 * This function is designed to be called from prepareListQuery
 *
 * @param entity - The main entity (e.g., "product", "campaign")
 * @param fields - Array of field names to check
 * @param policies - Array of policy objects with resource and operation
 * @param userRoles - User roles for permission checking
 * @param container - MedusaContainer for permission checking
 * @returns Array of field names that are not allowed by policies
 */
export async function getNotAllowedFieldsByPolicies({
  entity,
  fields,
  policies,
  userRoles,
  container,
}: {
  entity: string
  fields: string[]
  policies: Array<{ resource: string; operation: string }>
  userRoles: string[]
  container: MedusaContainer
}): Promise<string[]> {
  const notAllowedFields: string[] = []

  if (!fields.length || !policies.length) {
    return notAllowedFields
  }

  // Get the normalized entry point name for policy comparison
  const normalizedentity = toSnakeCase(entity)

  for (const field of fields) {
    let fieldAllowed = false

    // Handle star fields like "product.*" - these represent all fields of an entity
    if (field.endsWith(".*")) {
      const entityName = field.slice(0, -2) // Remove ".*" suffix
      const normalizedEntityName = getNormalizedEntityName(entityName)

      if (normalizedEntityName) {
        // Check if user has permission to access this entity
        const hasAccess = await hasPermission({
          roles: userRoles,
          actions: { resource: normalizedEntityName, operation: "read" },
          container,
        })

        if (hasAccess) {
          fieldAllowed = true
        }
      } else {
        // If we can't resolve the entity name, allow it by default
        fieldAllowed = true
      }
    } else {
      // Handle regular field paths
      const fullFieldPath = entity + "." + field

      // Get the actual entity name from the GraphQL schema
      const normalizedEntityName = getNormalizedEntityName(fullFieldPath)

      if (normalizedEntityName) {
        // Check if user has permission to access this entity
        const hasAccess = await hasPermission({
          roles: userRoles,
          actions: { resource: normalizedEntityName, operation: "read" },
          container,
        })

        if (hasAccess) {
          fieldAllowed = true
        }
      } else {
        // If we can't resolve the entity name, check the entry point itself
        const hasAccess = await hasPermission({
          roles: userRoles,
          actions: { resource: normalizedentity, operation: "read" },
          container,
        })

        if (hasAccess) {
          fieldAllowed = true
        }
      }
    }

    if (!fieldAllowed) {
      notAllowedFields.push(field)
    }
  }

  return notAllowedFields
}
