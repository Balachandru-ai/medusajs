import { Module, Modules } from "@medusajs/framework/utils"
import { default as OrderModuleService } from "#services/order-module-service"

export default Module(Modules.ORDER, {
  service: OrderModuleService,
})
