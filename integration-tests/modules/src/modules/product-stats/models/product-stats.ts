import { model } from "@medusajs/utils"

const ProductStats = model.define("ProductStats", {
  id: model.id({ prefix: "pstat" }).primaryKey(),
  product_id: model.text(),
  sale_count: model.number().default(0),
})

export default ProductStats
