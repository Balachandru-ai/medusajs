import { model } from "@medusajs/framework/utils"
import Product from "./product"
import ProductOption from "./product-option"
import ProductProductOptionValue from "./product-product-option-value"
import ProductOptionValue from "./product-option-value"

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
})

export default ProductProductOption
