import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, ITranslationModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  defineFileConfig,
  FeatureFlag,
  Modules,
  promiseAll,
} from "@medusajs/framework/utils"
import TranslationFeatureFlag from "../../../../feature-flags/translation"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminTranslationStatisticsParams>,
  res: MedusaResponse<HttpTypes.AdminTranslationStatisticsResponse>
) => {
  const translationService = req.scope.resolve<ITranslationModuleService>(
    Modules.TRANSLATION
  )
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { locales, entity_types } = req.validatedBody

  // Fetch counts for each entity type in parallel
  const entityCounts = await promiseAll(
    entity_types.map(async (entityType) => {
      const { metadata } = await query.graph({
        entity: entityType,
        fields: ["id"],
        pagination: { take: 0 },
      })
      return { entityType, count: metadata?.count ?? 0 }
    })
  )

  const entities: Record<string, { count: number }> = {}
  for (const { entityType, count } of entityCounts) {
    entities[entityType] = { count }
  }

  const statistics = await translationService.getStatistics({
    locales,
    entities,
  })

  return res.status(200).json({
    statistics,
  })
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled(TranslationFeatureFlag.key),
})
