import SalesChannel from "#models/sales-channel"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.SALES_CHANNEL, {
  entities: [SalesChannel],
})
