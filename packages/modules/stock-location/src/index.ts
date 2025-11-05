import { Module, Modules } from "@medusajs/framework/utils"
import StockLocationModuleService from "#services/stock-location-module"

export default Module(Modules.STOCK_LOCATION, {
  service: StockLocationModuleService,
})
