import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AdminBatchTranslations,
  AdminGetTranslationsParams,
} from "./validators"
import * as QueryConfig from "./query-config"
import { DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT } from "../../../utils"
import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaErrorTypes,
  Modules,
} from "@medusajs/framework/utils"
import { IFlagRouter } from "@medusajs/framework/types"
import TranslationFeatureFlag from "../../../feature-flags/translation"

const isTranslationsEnabledMiddleware = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const flagRouter = req.scope.resolve<IFlagRouter>(
    ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
  )
  const translationsModuleService = req.scope.resolve(Modules.TRANSLATION, {
    allowUnregistered: true,
  })

  const isTranslationsEnabled =
    flagRouter.isFeatureEnabled(TranslationFeatureFlag.key) &&
    !!translationsModuleService

  if (!isTranslationsEnabled) {
    throw new MedusaError(
      MedusaErrorTypes.NOT_FOUND,
      `Translations feature flag is not enabled, make sure to set the appropiate environment variable or enable it in your medusa-config.ts file`
    )
  }

  return next()
}

export const adminTranslationsRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/translations",
    middlewares: [
      isTranslationsEnabledMiddleware,
      validateAndTransformQuery(
        AdminGetTranslationsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/translations/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [
      isTranslationsEnabledMiddleware,
      validateAndTransformBody(AdminBatchTranslations),
    ],
  },
]
