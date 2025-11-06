import PriceListRule from "#models/price-list-rule"
import PriceList from "#models/price-list"
import PricePreference from "#models/price-preference"
import PriceRule from "#models/price-rule"
import PriceSet from "#models/price-set"
import Price from "#models/price"
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.PRICING, {
  entities: [
    PriceListRule,
    PriceList,
    PricePreference,
    PriceRule,
    PriceSet,
    Price,
  ],
})
