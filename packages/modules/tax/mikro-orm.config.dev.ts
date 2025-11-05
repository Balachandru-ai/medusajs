import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"
import TaxProvider from "#models/tax-provider"
import TaxRateRule from "#models/tax-rate-rule"
import TaxRate from "#models/tax-rate"
import TaxRegion from "#models/tax-region"

export default defineMikroOrmCliConfig(Modules.TAX, {
  entities: [TaxProvider, TaxRateRule, TaxRate, TaxRegion],
})
