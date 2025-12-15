export const PRODUCT_TRANSLATABLE_FIELDS = [
  "title",
  "description",
  "material",
  "subtitle",
  "status",
]
export const PRODUCT_VARIANT_TRANSLATABLE_FIELDS = ["title", "material"]
export const PRODUCT_TYPE_TRANSLATABLE_FIELDS = ["value"]
export const PRODUCT_COLLECTION_TRANSLATABLE_FIELDS = ["title"]
export const PRODUCT_CATEGORY_TRANSLATABLE_FIELDS = ["name", "description"]
export const PRODUCT_TAG_TRANSLATABLE_FIELDS = ["value"]

export const translatableFieldsConfig = {
  product: PRODUCT_TRANSLATABLE_FIELDS,
  product_variant: PRODUCT_VARIANT_TRANSLATABLE_FIELDS,
  product_type: PRODUCT_TYPE_TRANSLATABLE_FIELDS,
  product_collection: PRODUCT_COLLECTION_TRANSLATABLE_FIELDS,
  product_category: PRODUCT_CATEGORY_TRANSLATABLE_FIELDS,
  product_tag: PRODUCT_TAG_TRANSLATABLE_FIELDS,
}
