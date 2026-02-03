import { Module, Modules } from "@medusajs/framework/utils"
import { LoyaltyModuleService } from "@services"

export default Module(Modules.LOYALTY, {
  service: LoyaltyModuleService,
})
