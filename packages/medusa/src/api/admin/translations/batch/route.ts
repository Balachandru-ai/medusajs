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

  const [created, updated] = await Promise.all([
    listTranslations(
      result.created.map((t) => t.id),
      req.scope
    ),
    listTranslations(
      result.updated.map((t) => t.id),
      req.scope
    ),
  ])

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

const listTranslations = async (ids: string[], scope: MedusaContainer) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "translation",
    fields: defaultAdminTranslationFields,
    filters: { id: ids },
  })
  return data
}
