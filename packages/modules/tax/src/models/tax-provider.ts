import { model } from "@medusajs/framework/utils"
import TaxRegion from "#models/tax-region"

const TaxProvider = model.define("TaxProvider", {
  id: model.id().primaryKey(),
  is_enabled: model.boolean().default(true),
  regions: model.hasMany(() => TaxRegion, {
    mappedBy: "provider",
  }),
})

export default TaxProvider
