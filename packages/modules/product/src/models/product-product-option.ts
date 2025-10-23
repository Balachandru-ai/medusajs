import { model } from "@medusajs/framework/utils"
import Product from "./product"
import ProductOption from "./product-option"

const ProductProductOption = model.define("ProductProductOption", {
  id: model.id({ prefix: "prodopt" }).primaryKey(),
  product: model.belongsTo(() => Product, {
    mappedBy: "options",
  }),
  product_option: model.belongsTo(() => ProductOption, {
    mappedBy: "products",
  }),
})

export default ProductProductOption
