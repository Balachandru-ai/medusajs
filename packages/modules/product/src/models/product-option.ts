import { model } from "@medusajs/framework/utils"
import { Product } from "./index"
import ProductOptionValue from "./product-option-value"

const ProductOption = model
  .define("ProductOption", {
    id: model.id({ prefix: "opt" }).primaryKey(),
    title: model.text().searchable(),
    is_exclusive: model.boolean().default(false),
    metadata: model.json().nullable(),
    products: model.manyToMany(() => Product),
    values: model.hasMany(() => ProductOptionValue, {
      mappedBy: "option",
    }),
  })
  .cascades({
    delete: ["values"],
    detach: ["products"],
  })

export default ProductOption
