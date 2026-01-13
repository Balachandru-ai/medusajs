/**
 * @deprecated Use `@medusajs/medusa/event` instead. This module will be removed in a future version.
 * The new event module supports providers for local and Redis implementations.
 *
 * Migration guide:
 * - Replace `@medusajs/medusa/event-bus-local` with `@medusajs/medusa/event`
 * - The local provider is the default and requires no additional configuration
 */
import LocalEventBusModule from "@medusajs/event-bus-local"

console.warn(
  "[DEPRECATION WARNING] @medusajs/medusa/event-bus-local is deprecated. " +
    "Use @medusajs/medusa/event instead. This module will be removed in a future version."
)

export * from "@medusajs/event-bus-local"
export default LocalEventBusModule
export const discoveryPath = require.resolve("@medusajs/event-bus-local")
