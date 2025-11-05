import Currency from "#models/currency"
import Store from "#models/store"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.STORE, {
  entities: [Currency, Store],
})
