import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<
    undefined,
    HttpTypes.AdminTranslationEntitiesParams
  >,
  res: MedusaResponse<HttpTypes.AdminTranslationEntitiesResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { type } = req.validatedQuery

  const {
    data: [translationSettings],
  } = await query.graph(
    {
      entity: "translation_settings",
      fields: ["*"],
      filters: {
        entity_type: type,
      },
    },
    {
      cache: { enable: true },
    }
  )

  const translatableFields = translationSettings?.fields ?? []

  const { data: entities, metadata } = await query
    .graph(
      {
        entity: type,
        fields: ["id", ...translatableFields],
        pagination: req.queryConfig.pagination,
      },
      {
        cache: { enable: true },
      }
    )
    .catch((e) => {
      const normalizedMessage = e.message.toLowerCase()
      if (
        normalizedMessage.includes("service with alias") &&
        normalizedMessage.includes("was not found")
      ) {
        return { data: [], metadata: { count: 0, skip: 0, take: 0 } }
      }
      throw e
    })

  return res.json({
    data: entities,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
