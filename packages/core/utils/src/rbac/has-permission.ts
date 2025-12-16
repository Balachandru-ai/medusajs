import { MedusaContainer } from "@medusajs/framework/types"
import { useCache } from "../caching"
import { ContainerRegistrationKeys } from "../common"

export type PermissionAction = {
  resource: string
  operation: string
}

export type HasPermissionInput = {
  roles: string | string[]
  actions: PermissionAction | PermissionAction[]
  container: MedusaContainer
}

type RolePoliciesCache = Map<string, Map<string, Set<string>>>

/**
 * Checks if the given role(s) have permission to perform the specified action(s).
 *
 * @param input - The input containing roles, actions, and container
 * @returns true if all actions are permitted, false otherwise
 *
 * @example
 * ```ts
 * const canWrite = await hasPermission({
 *   roles: ['role_123'],
 *   actions: { resource: 'product', operation: 'write' },
 *   container
 * })
 * ```
 */
export async function hasPermission(
  input: HasPermissionInput
): Promise<boolean> {
  const { roles, actions, container } = input

  const roleIds = Array.isArray(roles) ? roles : [roles]
  const actionList = Array.isArray(actions) ? actions : [actions]

  if (!roleIds?.length || !actionList?.length) {
    return true
  }

  const rolePoliciesMap = await fetchRolePolicies(roleIds, container)

  for (const action of actionList) {
    let hasAccess = false

    for (const roleId of roleIds) {
      const resourceMap = rolePoliciesMap.get(roleId)
      if (!resourceMap) {
        continue
      }

      const operations = resourceMap.get(action.resource)
      if (operations && operations.has(action.operation)) {
        hasAccess = true
        break
      }
    }

    if (!hasAccess) {
      return false
    }
  }

  return true
}

/**
 * Fetches a single role's policies from cache or database.
 * Each role is cached individually for optimal cache reuse.
 */
async function fetchSingleRolePolicies(
  roleId: string,
  container: MedusaContainer
): Promise<Map<string, Set<string>>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  return await useCache<Map<string, Set<string>>>(
    async () => {
      const { data: roles } = await query.graph({
        entity: "rbac_role",
        fields: ["id", "policies.*"],
        filters: { id: roleId },
      })

      const role = roles[0]
      const resourceMap = new Map<string, Set<string>>()

      if (role?.policies && Array.isArray(role.policies)) {
        const policyIds: string[] = []

        for (const policy of role.policies) {
          policyIds.push(policy.id)

          if (!resourceMap.has(policy.resource)) {
            resourceMap.set(policy.resource, new Set())
          }
          resourceMap.get(policy.resource)!.add(policy.operation)
        }

        // Store policy IDs for cache tagging
        ;(resourceMap as any).__policyIds = policyIds
      }

      return resourceMap
    },
    {
      container,
      key: roleId,
      tags: [`role:${roleId}`], // TODO: fix this
      ttl: 60 * 60 * 24 * 7,
    }
  )
}

/**
 * Fetches policies for multiple roles by composing individually cached role queries.
 * This allows for better cache reuse across different permission checks.
 */
async function fetchRolePolicies(
  roleIds: string[],
  container: MedusaContainer
): Promise<RolePoliciesCache> {
  const rolePoliciesMap: RolePoliciesCache = new Map()

  // Fetch each role's policies individually (cached)
  await Promise.all(
    roleIds.map(async (roleId) => {
      const resourceMap = await fetchSingleRolePolicies(roleId, container)
      rolePoliciesMap.set(roleId, resourceMap)
    })
  )

  return rolePoliciesMap
}
