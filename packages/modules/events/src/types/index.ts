import {
  ModuleProviderExports,
  ModuleServiceInitializeOptions,
} from "@medusajs/framework/types"

export const EventDefaultProvider = "event_default_provider"
export const EventIdentifiersRegistrationName = "event_providers_identifier"

export const EventProviderRegistrationPrefix = "ep_"

export type EventModuleOptions = Partial<ModuleServiceInitializeOptions> & {
  /**
   * Providers to be registered
   */
  providers?: {
    /**
     * The module provider to be registered
     */
    resolve: string | ModuleProviderExports
    /**
     * If the provider is the default
     */
    is_default?: boolean
    /**
     * The id of the provider
     */
    id: string
    /**
     * key value pair of the configuration to be passed to the provider constructor
     */
    options?: Record<string, unknown>
  }[]
}

declare module "@medusajs/types" {
  interface ModuleOptions {
    "@medusajs/events": EventModuleOptions
    "@medusajs/medusa/events": EventModuleOptions
  }
}
