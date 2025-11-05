import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"
import ProductCategory from "#models/product-category"
import ProductCollection from "#models/product-collection"
import ProductImage from "#models/product-image"
import ProductOptionValue from "#models/product-option-value"
import ProductOption from "#models/product-option"
import ProductTag from "#models/product-tag"
import ProductType from "#models/product-type"
import ProductVariantProductImage from "#models/product-variant-product-image"
import ProductVariant from "#models/product-variant"
import Product from "#models/product"

export default defineMikroOrmCliConfig(Modules.PRODUCT, {
  entities: [
    ProductCategory,
    ProductCollection,
    ProductImage,
    ProductOptionValue,
    ProductOption,
    ProductTag,
    ProductType,
    ProductVariantProductImage,
    ProductVariant,
    Product,
  ],
})
