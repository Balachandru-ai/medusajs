import { applyAndAndOrOperators } from "../../utils/common-validators"
import {
  createBatchBody,
  createFindParams,
  createSelectParams,
} from "../../utils/validators"
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

export type AdminCreateTranslationType = z.infer<typeof AdminCreateTranslation>
export const AdminCreateTranslation = z.object({
  entity_id: z.string(),
  entity_type: z.string(),
  locale_code: z.string(),
  translations: z.record(z.string()),
})

export type AdminUpdateTranslationType = z.infer<typeof AdminUpdateTranslation>
export const AdminUpdateTranslation = z.object({
  id: z.string(),
  entity_id: z.string().optional(),
  entity_type: z.string().optional(),
  locale_code: z.string().optional(),
  translations: z.record(z.string()).optional(),
})

export type AdminBatchTranslationsType = z.infer<typeof AdminBatchTranslations>
export const AdminBatchTranslations = createBatchBody(
  AdminCreateTranslation,
  AdminUpdateTranslation
)
