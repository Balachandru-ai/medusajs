import { getCallerFilePath, isFileDisabled, MEDUSA_SKIP_FILE } from "../common"

/**
 * Converts a string to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
}

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
  var Resource: Record<string, string>
  // eslint-disable-next-line no-var
  var Operation: Record<string, string>
  // eslint-disable-next-line no-var
  var Policy: Record<string, { resource: string; operation: string }>
}

/**
 * Global registry for resource-operation mappings.
 * Maps resource names to sets of operations.
 */
export const PolicyResource =
  global.PolicyResource ?? new Map<string, Set<string>>()
global.PolicyResource ??= PolicyResource

/**
 * Global registry for all unique resources.
 */
const defaultResources = [
  "api-key",
  "campaign",
  "claim",
  "collection",
  "currency",
  "customer",
  "customer-group",
  "draft-order",
  "exchange",
  "fulfillment",
  "fulfillment-provider",
  "fulfillment-set",
  "inventory",
  "inventory-item",
  "invite",
  "locale",
  "notification",
  "order",
  "order-change",
  "order-edit",
  "payment",
  "payment-collection",
  "payment-provider",
  "price-list",
  "price-preference",
  "product",
  "product-category",
  "product-tag",
  "product-type",
  "product-variant",
  "promotion",
  "rbac",
  "refund-reason",
  "region",
  "reservation",
  "return",
  "return-reason",
  "sales-channel",
  "shipping-option",
  "shipping-option-type",
  "shipping-profile",
  "stock-location",
  "store",
  "tax",
  "tax-provider",
  "tax-rate",
  "tax-region",
  "translation",
  "upload",
  "user",
  "workflow-execution",
]

export const Resource = global.Resource ?? {}
global.Resource ??= Resource

for (const resource of defaultResources) {
  const resourceKey = toSnakeCase(resource)
  Resource[resourceKey] = resource
}

/**
 * Global registry for all unique operations.
 */
const defaultOperations = ["read", "write", "update", "delete", "*"]

export const Operation = global.Operation ?? {}
global.Operation ??= Operation

for (const operation of defaultOperations) {
  const operationKey = operation === "*" ? "all" : toSnakeCase(operation)
  Operation[operationKey] = operation
}

export const Policy = global.Policy ?? {}
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
    policy.resource = policy.resource.toLowerCase()
    policy.operation = policy.operation.toLowerCase()

    if (!PolicyResource.has(policy.resource)) {
      PolicyResource.set(policy.resource, new Set())
    }
    PolicyResource.get(policy.resource)!.add(policy.operation)

    const resourceKey = toSnakeCase(policy.resource)
    Resource[resourceKey] = policy.resource

    const operationKey = toSnakeCase(policy.operation)
    Operation[operationKey] = policy.operation

    // Register in Policy object with name as key
    Policy[policy.name] = {
      resource: policy.resource,
      operation: policy.operation,
    }
  }

  const output: DefinePolicyExport = {
    [MedusaPolicySymbol]: true,
    policies: policiesArray,
  }

  return output
}
