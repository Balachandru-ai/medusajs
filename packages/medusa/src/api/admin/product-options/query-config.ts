export const defaultAdminProductOptionsFields = [
  "id",
  "title",
  "is_exclusive",
  "values.*",
  "created_at",
  "updated_at",
  "metadata",
]

export const retrieveProductOptionsTransformQueryConfig = {
  defaults: defaultAdminProductOptionsFields,
  isList: false,
}

export const listProductOptionsTransformQueryConfig = {
  ...retrieveProductOptionsTransformQueryConfig,
  defaultLimit: 20,
  isList: true,
}
