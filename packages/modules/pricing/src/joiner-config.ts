import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import PriceSet from "#models/price-set"
import PriceList from "#models/price-list"
import Price from "#models/price"
import PricePreference from "#models/price-preference"

export const joinerConfig = defineJoinerConfig(Modules.PRICING, {
  models: [PriceSet, PriceList, Price, PricePreference],
})
