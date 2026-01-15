/**
 * @deprecated Use `@medusajs/medusa/events` instead. This module will be removed in a future version.
 * The new events module supports providers for local and Redis implementations.
 *
 * Migration guide:
 * - Replace `@medusajs/medusa/event-bus-local` with `@medusajs/medusa/events`
 * - The local provider is the default and requires no additional configuration
 */
import LocalEventBusModule from "@medusajs/event-bus-local"

console.warn(
  "[DEPRECATION WARNING] @medusajs/medusa/event-bus-local is deprecated. " +
    "Use @medusajs/medusa/events instead. This module will be removed in a future version."
)

export * from "@medusajs/event-bus-local"
export default LocalEventBusModule
export const discoveryPath = require.resolve("@medusajs/event-bus-local")
