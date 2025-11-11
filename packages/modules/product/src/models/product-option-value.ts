import { model } from "@medusajs/framework/utils"
import ProductVariant from "./product-variant"
import ProductOption from "./product-option"
import ProductProductOption from "./product-product-option"

const ProductOptionValue = model
  .define("ProductOptionValue", {
    id: model.id({ prefix: "optval" }).primaryKey(),
    value: model.text(),
    rank: model.number().nullable(),
    metadata: model.json().nullable(),
    option: model
      .belongsTo(() => ProductOption, {
        mappedBy: "values",
      })
      .nullable(),
    variants: model.manyToMany(() => ProductVariant, {
      mappedBy: "options",
    }),
    product_product_options: model.manyToMany(() => ProductProductOption),
  })
  .indexes([
    {
      name: "IDX_option_value_option_id_unique",
      on: ["option_id", "value"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default ProductOptionValue
