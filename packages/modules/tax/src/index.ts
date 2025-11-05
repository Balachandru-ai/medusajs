import TaxModuleService from "#services/tax-module-service"
import loadProviders from "#loaders/providers"
import { Module, Modules } from "@medusajs/framework/utils"

export default Module(Modules.TAX, {
  service: TaxModuleService,
  loaders: [loadProviders],
})
