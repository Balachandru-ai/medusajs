import { Module, Modules } from "@medusajs/framework/utils"
import { default as PricingModuleService } from "#services/pricing-module"

export default Module(Modules.PRICING, {
  service: PricingModuleService,
})

export * from "#types/index"
