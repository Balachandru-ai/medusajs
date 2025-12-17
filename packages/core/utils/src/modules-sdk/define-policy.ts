import { getCallerFilePath, isFileDisabled, MEDUSA_SKIP_FILE } from "../common"

export const MedusaPolicySymbol = Symbol.for("MedusaPolicy")

export interface PolicyDefinition {
  name: string
  resource: string
  operation: string
  description?: string
}

export interface DefinePolicyExport {
  [MedusaPolicySymbol]: boolean
  policies: PolicyDefinition[]
}

declare global {
  // eslint-disable-next-line no-var
  var PolicyResource: Map<string, Set<string>>
  // eslint-disable-next-line no-var
  var Policy: Map<string, { resource: string; operation: string }>
}

/**
 * Global registry for resource-operation mappings.
 * Maps resource names to sets of operations.
 */
export const PolicyResource =
  global.PolicyResource ?? new Map<string, Set<string>>()
global.PolicyResource ??= PolicyResource

/**
 * Global registry for named RBAC policies.
 * Maps policy names to their resource-operation pairs.
 */
export const Policy =
  global.Policy ?? new Map<string, { resource: string; operation: string }>()
global.Policy ??= Policy

/**
 * Define RBAC policies that will be automatically synced to the database
 * when the application starts.
 *
 * @param policies - Single policy or array of policy definitions
 *
 * @example
 * ```ts
 * definePolicy({
 *   name: "ReadBrands",
 *   resource: "brand",
 *   operation: "read"
 * })
 *
 * definePolicy([
 *   {
 *     name: "ReadBrands",
 *     resource: "brand",
 *     operation: "read"
 *   },
 *   {
 *     name: "WriteBrands",
 *     resource: "brand",
 *     operation: "write"
 *   }
 * ])
 * ```
 */
export function definePolicy(
  policies: PolicyDefinition | PolicyDefinition[]
): DefinePolicyExport {
  const callerFilePath = getCallerFilePath()
  if (isFileDisabled(callerFilePath ?? "")) {
    return { [MEDUSA_SKIP_FILE]: true } as any
  }

  const policiesArray = Array.isArray(policies) ? policies : [policies]

  for (const policy of policiesArray) {
    if (!policy.name || !policy.resource || !policy.operation) {
      throw new Error(
        `Policy definition must include name, resource, and operation. Received: ${JSON.stringify(
          policy,
          null,
          2
        )}`
      )
    }
  }

  for (const policy of policiesArray) {
    // Register in PolicyResource map
    if (!PolicyResource.has(policy.resource)) {
      PolicyResource.set(policy.resource, new Set())
    }
    PolicyResource.get(policy.resource)!.add(policy.operation)

    // Register in Policy map with name as key
    Policy.set(policy.name, {
      resource: policy.resource,
      operation: policy.operation,
    })
  }

  const output: DefinePolicyExport = {
    [MedusaPolicySymbol]: true,
    policies: policiesArray,
  }

  return output
}
