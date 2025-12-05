import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BatchMethodRequest, HttpTypes, MedusaContainer } from "@medusajs/types"
import {
  AdminCreateTranslationType,
  AdminUpdateTranslationType,
} from "../validators"
import { batchTranslationsWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { defaultAdminTranslationFields } from "../query-config"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    BatchMethodRequest<AdminCreateTranslationType, AdminUpdateTranslationType>
  >,
  res: MedusaResponse<HttpTypes.AdminTranslationsBatchResponse>
) => {
  const { create = [], update = [], delete: deleteIds = [] } = req.validatedBody

  const { result } = await batchTranslationsWorkflow(req.scope).run({
    input: {
      create,
      update,
      delete: deleteIds,
    },
  })

  const ids = Array.from(
    new Set([
      ...result.created.map((t) => t.id),
      ...result.updated.map((t) => t.id),
    ])
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: translations } = await query.graph({
    entity: "translation",
    fields: defaultAdminTranslationFields,
    filters: {
      id: ids,
    },
  })

  const created = translations.filter((t) =>
    result.created.some((r) => r.id === t.id)
  )
  const updated = translations.filter((t) =>
    result.updated.some((r) => r.id === t.id)
  )

  return res.status(200).json({
    created,
    updated,
    deleted: {
      ids: deleteIds,
      object: "translation",
      deleted: true,
    },
  })
}
