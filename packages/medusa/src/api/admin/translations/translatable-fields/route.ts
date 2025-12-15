import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, ITranslationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminTranslatableFieldsResponse>
) => {
  const translationService = req.scope.resolve<ITranslationModuleService>(
    Modules.TRANSLATION
  )
  const translatableFields = translationService.getTranslatableFields()

  res.status(200).json({
    translatableFields,
  })
}
