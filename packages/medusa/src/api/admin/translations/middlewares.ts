import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT } from "../../../utils"
import * as QueryConfig from "./query-config"
import {
  AdminBatchTranslations,
  AdminGetTranslationsParams,
  AdminTranslationEntitiesParams,
  AdminTranslationSettingsParams,
  AdminTranslationStatistics,
} from "./validators"

export const adminTranslationsRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["ALL"],
    matcher: "/admin/translations/*",
  },
  {
    method: ["GET"],
    matcher: "/admin/translations",
    middlewares: [
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
    middlewares: [validateAndTransformBody(AdminBatchTranslations)],
  },
  {
    method: ["GET"],
    matcher: "/admin/translations/statistics",
    middlewares: [validateAndTransformQuery(AdminTranslationStatistics, {})],
  },
  {
    method: ["GET"],
    matcher: "/admin/translations/settings",
    middlewares: [
      validateAndTransformQuery(AdminTranslationSettingsParams, {}),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/translations/entities",
    middlewares: [
      validateAndTransformQuery(
        AdminTranslationEntitiesParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
]
