import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import StockLocation from "#models/stock-location"
import { default as schema } from "#schema/index"

export const joinerConfig = defineJoinerConfig(Modules.STOCK_LOCATION, {
  schema,
  linkableKeys: {
    stock_location_id: StockLocation.name,
    location_id: StockLocation.name,
  },
})
