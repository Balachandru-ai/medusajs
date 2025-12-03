import { applyAndAndOrOperators } from "../../utils/common-validators"
import { createFindParams, createSelectParams } from "../../utils/validators"
import { z } from "zod"

export const AdminGetTranslationParams = createSelectParams()

export const AdminGetTranslationParamsFields = z.object({
  q: z.string().optional(),
  entity_id: z.string().optional(),
  entity_type: z.string().optional(),
  locale_code: z.string().optional(),
})

export type AdminGetTranslationsParamsType = z.infer<
  typeof AdminGetTranslationsParams
>

export const AdminGetTranslationsParams = createFindParams({
  limit: 20,
  offset: 0,
})
  .merge(AdminGetTranslationParamsFields)
  .merge(applyAndAndOrOperators(AdminGetTranslationParamsFields))
