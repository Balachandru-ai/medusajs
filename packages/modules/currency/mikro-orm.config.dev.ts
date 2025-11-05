import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"
import Currency from "#models/currency"

export default defineMikroOrmCliConfig(Modules.CURRENCY, {
  entities: [Currency],
})
