import { Module } from "@medusajs/utils"
import { ProductStatsModuleService } from "./service"

export const PRODUCT_STATS_MODULE = "productStats"

export default Module(PRODUCT_STATS_MODULE, {
  service: ProductStatsModuleService,
})
