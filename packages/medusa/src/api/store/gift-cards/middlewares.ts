import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { retrieveGiftCardTransformQueryConfig } from "./query-config"
import { StoreGetGiftCardParams } from "./validators"

export const storeGiftCardRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/gift-cards/:code",
    middlewares: [
      validateAndTransformQuery(
        StoreGetGiftCardParams,
        retrieveGiftCardTransformQueryConfig
      ),
    ],
  },
]
