import { model } from "@medusajs/framework/utils"
import ProductProductOption from "./product-product-option"
import ProductOptionValue from "./product-option-value"

const ProductProductOptionValue = model.define("ProductProductOptionValue", {
  id: model.id({ prefix: "prodoptval" }).primaryKey(),
  product_product_option: model.belongsTo(() => ProductProductOption, {
    mappedBy: "values",
  }),
  product_option_value: model.belongsTo(() => ProductOptionValue, {
    mappedBy: "product_product_options",
  }),
})

export default ProductProductOptionValue
