export const defaultAdminTranslationFields = [
  "id",
  "entity_id",
  "entity_type",
  "locale_code",
  "translations",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminTranslationFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
