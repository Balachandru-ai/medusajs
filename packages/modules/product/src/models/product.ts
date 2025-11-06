import { model, ProductUtils } from "@medusajs/framework/utils"

import ProductCategory from "#models/product-category"
import ProductCollection from "#models/product-collection"
import ProductImage from "#models/product-image"
import ProductOption from "#models/product-option"
import ProductTag from "#models/product-tag"
import ProductType from "#models/product-type"
import ProductVariant from "#models/product-variant"

const Product = model
  .define("Product", {
    id: model.id({ prefix: "prod" }).primaryKey(),
    title: model.text().searchable(),
    handle: model.text(),
    subtitle: model.text().searchable().nullable(),
    description: model.text().searchable().nullable(),
    is_giftcard: model.boolean().default(false),
    status: model
      .enum(ProductUtils.ProductStatus)
      .default(ProductUtils.ProductStatus.DRAFT),
    thumbnail: model.text().nullable(),
    weight: model.text().nullable(),
    length: model.text().nullable(),
    height: model.text().nullable(),
    width: model.text().nullable(),
    origin_country: model.text().nullable(),
    hs_code: model.text().nullable(),
    mid_code: model.text().nullable(),
    material: model.text().nullable(),
    discountable: model.boolean().default(true),
    external_id: model.text().nullable(),
    metadata: model.json().nullable(),
    variants: model.hasMany(() => ProductVariant, {
      mappedBy: "product",
    }),
    type: model
      .belongsTo(() => ProductType, {
        mappedBy: "products",
      })
      .nullable(),
    tags: model.manyToMany(() => ProductTag, {
      mappedBy: "products",
      pivotTable: "product_tags",
    }),
    options: model.hasMany(() => ProductOption, {
      mappedBy: "product",
    }),
    images: model.hasMany(() => ProductImage, {
      mappedBy: "product",
    }),
    collection: model
      .belongsTo(() => ProductCollection, {
        mappedBy: "products",
      })
      .nullable(),
    categories: model.manyToMany(() => ProductCategory, {
      pivotTable: "product_category_product",
      mappedBy: "products",
    }),
  })
  .cascades({
    delete: ["variants", "options", "images"],
  })
  .indexes([
    {
      name: "IDX_product_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_type_id",
      on: ["type_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_collection_id",
      on: ["collection_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_status",
      on: ["status"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ])

export default Product
