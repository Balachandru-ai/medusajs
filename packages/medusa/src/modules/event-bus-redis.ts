/**
 * @deprecated Use `@medusajs/medusa/events` with `@medusajs/events-redis` provider instead.
 * This module will be removed in a future version.
 *
 * Migration guide:
 * - Replace `@medusajs/medusa/event-bus-redis` with `@medusajs/medusa/events`
 * - Configure the Redis provider in your medusa-config.ts:
 *
 * ```ts
 * modules: [
 *   {
 *     resolve: "@medusajs/medusa/events",
 *     options: {
 *       providers: [
 *         {
 *           resolve: "@medusajs/events-redis",
 *           id: "redis",
 *           is_default: true,
 *           options: {
 *             redisUrl: process.env.REDIS_URL,
 *           },
 *         },
 *       ],
 *     },
 *   },
 * ]
 * ```
 */
import RedisEventBusModule from "@medusajs/event-bus-redis"

// console.warn(
//   "[DEPRECATION WARNING] @medusajs/medusa/event-bus-redis is deprecated. " +
//     "Use @medusajs/medusa/events with @medusajs/events-redis provider instead. " +
//     "This module will be removed in a future version."
// )

export * from "@medusajs/event-bus-redis"

export default RedisEventBusModule
export const discoveryPath = require.resolve("@medusajs/event-bus-redis")
