import { model } from "@medusajs/framework/utils"
import Product from "./product"
import ProductOption from "./product-option"
import ProductOptionValue from "./product-option-value"
import ProductProductOptionValue from "./product-product-option-value"

const ProductProductOption = model.define("ProductProductOption", {
  id: model.id({ prefix: "prodopt" }).primaryKey(),
  product: model.belongsTo(() => Product, {
    mappedBy: "options",
  }),
  product_option: model.belongsTo(() => ProductOption, {
    mappedBy: "products",
  }),
  values: model.manyToMany(() => ProductOptionValue, {
    pivotEntity: () => ProductProductOptionValue,
  }),
  product_values: model.hasMany(() => ProductProductOptionValue, {
    mappedBy: "product_product_option",
  }),
})

export default ProductProductOption
