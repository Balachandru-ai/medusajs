import StockLocationAddress from "#models/stock-location-address"
import StockLocation from "#models/stock-location"

import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.STOCK_LOCATION, {
  entities: [StockLocationAddress, StockLocation],
})
