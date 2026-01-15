/**
 * @deprecated Use `@medusajs/medusa/workflows` with `@medusajs/medusa/workflows-redis` provider instead.
 * This module will be removed in a future version.
 *
 * Migration guide:
 * 1. Replace `@medusajs/medusa/workflow-engine-redis` with `@medusajs/medusa/workflows`
 * 2. Add the Redis provider to your module configuration:
 *    {
 *      resolve: "@medusajs/medusa/workflows",
 *      options: {
 *        providers: [
 *          {
 *            resolve: "@medusajs/medusa/workflows-redis",
 *            id: "redis",
 *            options: {
 *              redisUrl: process.env.REDIS_URL,
 *            },
 *          },
 *        ],
 *      },
 *    }
 */
console.warn(
  "[DEPRECATION WARNING] @medusajs/medusa/workflow-engine-redis is deprecated. " +
    "Use @medusajs/medusa/workflows with @medusajs/medusa/workflows-redis provider instead."
)

import WorkflowsModule from "@medusajs/workflows"

export * from "@medusajs/workflows"

export default WorkflowsModule
export const discoveryPath = require.resolve("@medusajs/workflows")
