import { model } from "@medusajs/framework/utils"
import ProductVariant from "./product-variant"
import ProductImage from "./product-image"

const ProductVariantProductImage = model.define("ProductVariantProductImage", {
  id: model.id({ prefix: "pvpi" }).primaryKey(),
  created_by: model.text().nullable(),
  metadata: model.json().nullable(),
  variant: model.belongsTo(() => ProductVariant, {
    mappedBy: "images",
  }),
  image: model.belongsTo(() => ProductImage, {
    mappedBy: "variants",
  }),
})

export default ProductVariantProductImage
