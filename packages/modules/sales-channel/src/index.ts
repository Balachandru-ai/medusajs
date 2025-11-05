import { Module, Modules } from "@medusajs/framework/utils"
import SalesChannelModuleService from "#services/sales-channel-module"

export default Module(Modules.SALES_CHANNEL, {
  service: SalesChannelModuleService,
})
