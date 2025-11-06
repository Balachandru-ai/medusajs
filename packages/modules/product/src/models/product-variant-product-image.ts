import { model } from "@medusajs/framework/utils"
import ProductVariant from "#models/product-variant"
import ProductImage from "#models/product-image"

/**
 * @since 2.11.2
 */
const ProductVariantProductImage = model.define("ProductVariantProductImage", {
  id: model.id({ prefix: "pvpi" }).primaryKey(),
  variant: model.belongsTo(() => ProductVariant, {
    mappedBy: "images",
  }),
  image: model.belongsTo(() => ProductImage, {
    mappedBy: "variants",
  }),
})

export default ProductVariantProductImage
