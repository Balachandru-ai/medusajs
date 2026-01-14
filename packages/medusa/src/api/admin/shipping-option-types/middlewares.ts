import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminCreateShippingOptionType,
  AdminGetShippingOptionTypeParams,
  AdminGetShippingOptionTypesParams,
  AdminUpdateShippingOptionType,
} from "./validators"

export const adminShippingOptionTypeRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["ALL"],
    matcher: "/admin/shipping-option-types/*",
    policies: [
      {
        resource: Entities.shipping_option_type,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/shipping-option-types",
    middlewares: [
      validateAndTransformQuery(
        AdminGetShippingOptionTypesParams,
        QueryConfig.listShippingOptionTypesTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/shipping-option-types/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetShippingOptionTypeParams,
        QueryConfig.retrieveShippingOptionTypeTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-option-types",
    middlewares: [
      validateAndTransformBody(AdminCreateShippingOptionType),
      validateAndTransformQuery(
        AdminGetShippingOptionTypeParams,
        QueryConfig.retrieveShippingOptionTypeTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/shipping-option-types/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateShippingOptionType),
      validateAndTransformQuery(
        AdminGetShippingOptionTypeParams,
        QueryConfig.retrieveShippingOptionTypeTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/shipping-option-types/:id",
    middlewares: [],
  },
]
