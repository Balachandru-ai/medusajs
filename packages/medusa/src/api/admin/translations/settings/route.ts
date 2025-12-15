import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, ITranslationModuleService } from "@medusajs/framework/types"
import {
  defineFileConfig,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"
import TranslationFeatureFlag from "../../../../feature-flags/translation"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminTranslationSettingsResponse>
) => {
  const translationService = req.scope.resolve<ITranslationModuleService>(
    Modules.TRANSLATION
  )
  const translatable_fields = translationService.getTranslatableFields()

  res.json({
    translatable_fields,
  })
}

defineFileConfig({
  isDisabled: () => !FeatureFlag.isFeatureEnabled(TranslationFeatureFlag.key),
})
