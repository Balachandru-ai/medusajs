/**
 * @deprecated Use `@medusajs/medusa/workflows` instead.
 * This module will be removed in a future version.
 */
// console.warn(
//   "[DEPRECATION WARNING] @medusajs/medusa/workflow-engine-inmemory is deprecated. " +
//     "Use @medusajs/medusa/workflows instead."
// )

import WorkflowsModule from "@medusajs/workflow-engine-inmemory"

export * from "@medusajs/workflow-engine-inmemory"

export default WorkflowsModule
export const discoveryPath = require.resolve(
  "@medusajs/workflow-engine-inmemory"
)
