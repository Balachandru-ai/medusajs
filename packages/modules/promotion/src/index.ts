import { Module, Modules } from "@medusajs/framework/utils"
import PromotionModuleService from "#services/promotion-module"

export default Module(Modules.PROMOTION, {
  service: PromotionModuleService,
})
