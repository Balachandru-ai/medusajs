export const defaultAdminRbacRoleFields = [
  "id",
  "name",
  "parent_id",
  "description",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminRbacRoleFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 20,
  isList: true,
}
