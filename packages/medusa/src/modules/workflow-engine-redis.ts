/**
 * @deprecated Use `@medusajs/medusa/workflows` instead.
 * This module will be removed in a future version.
 */
console.warn(
  "[DEPRECATION WARNING] @medusajs/medusa/workflow-engine-redis is deprecated. " +
    "Use @medusajs/medusa/workflows instead."
)

import WorkflowsModule from "@medusajs/workflow-engine-redis"

export * from "@medusajs/workflow-engine-redis"

export default WorkflowsModule
export const discoveryPath = require.resolve("@medusajs/workflow-engine-redis")
