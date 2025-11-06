import { model } from "@medusajs/framework/utils"
import Price from "#models/price"

const PriceSet = model
  .define("PriceSet", {
    id: model.id({ prefix: "pset" }).primaryKey(),
    prices: model.hasMany(() => Price, {
      mappedBy: "price_set",
    }),
  })
  .cascades({
    delete: ["prices"],
  })

export default PriceSet
