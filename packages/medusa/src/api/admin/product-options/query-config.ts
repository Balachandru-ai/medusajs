export enum Entities {
  product_option = "product_option",
}

export const defaultAdminProductOptionsFields = [
  "id",
  "title",
  "is_exclusive",
  "values.*",
  "products.*",
  "created_at",
  "updated_at",
  "metadata",
]

export const retrieveProductOptionsTransformQueryConfig = {
  defaults: defaultAdminProductOptionsFields,
  isList: false,
  entity: Entities.product_option,
}

export const listProductOptionsTransformQueryConfig = {
  ...retrieveProductOptionsTransformQueryConfig,
  defaultLimit: 20,
  isList: true,
  entity: Entities.product_option,
}
