import { FileSystem } from "../common/file-system"
import { Policy } from "./define-policy"

/**
 * Generates TypeScript type definitions for all registered RBAC policies.
 * Creates a "policy-bindings.d.ts" file with named policy types and a namespace.
 *
 * @param outputDir - Directory where the type definition file should be created
 * @param interfaceName - Name of the namespace to generate (default: "RegisteredPolicies")
 */
export async function generatePolicyTypes({
  outputDir,
  interfaceName = "RegisteredPolicies",
}: {
  outputDir: string
  interfaceName?: string
}) {
  const policyTypeEntries: string[] = []
  const policyNames: string[] = []

  // Generate type entries for each named policy
  for (const [name, { resource, operation }] of Policy.entries()) {
    policyTypeEntries.push(
      `  ${name}: { resource: "${resource}"; operation: "${operation}" }`
    )
    policyNames.push(`"${name}"`)
  }

  // If no policies are registered, create empty types
  const policyInterface =
    policyTypeEntries.length > 0
      ? `{\n${policyTypeEntries.join("\n")}\n}`
      : "{}"

  const policyNamesUnion =
    policyNames.length > 0 ? policyNames.join(" | ") : "never"

  const fileSystem = new FileSystem(outputDir)
  const fileName = "policy-bindings.d.ts"
  const fileContents = `declare module '@medusajs/framework/types' {
  /**
   * Registered RBAC policies with their resource and operation mappings.
   * Access policies using Policy.PolicyName (e.g., Policy.ReadProduct)
   * 
   * @example
   * import { Policy } from '@medusajs/framework/utils'
   * 
   * // Access a policy definition
   * const readProduct = Policy.ReadProduct
   * // { resource: "product", operation: "read" }
   */
  export type ${interfaceName} = ${policyInterface}

  /**
   * Union type of all registered policy names
   */
  export type ${interfaceName}Names = ${policyNamesUnion}
}`

  await fileSystem.create(fileName, fileContents)
}
