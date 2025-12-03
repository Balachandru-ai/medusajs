import { MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework"
import { AdminGetTranslationsParams } from "./validators"
import * as QueryConfig from "./query-config"

export const adminTranslationsRoutesMiddlewares: MiddlewareRoute[] = [
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
]
