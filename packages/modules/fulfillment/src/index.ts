import FulfillmentModuleService from "#services/fulfillment-module-service"
import loadProviders from "#loaders/providers"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.FULFILLMENT, {
  service: FulfillmentModuleService,
  loaders: [loadProviders],
})

// Module options types
export { FulfillmentModuleOptions } from "#types/index"
