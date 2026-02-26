import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminCreateProductOption,
  AdminGetProductOptionParams,
  AdminGetProductOptionsParams,
  AdminUpdateProductOption,
} from "./validators"

export const adminProductOptionRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/product-options/*",
    policies: [
      {
        resource: Entities.product_option,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-options",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductOptionsParams,
        QueryConfig.listProductOptionsTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-options/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductOptionParams,
        QueryConfig.retrieveProductOptionsTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-options",
    middlewares: [
      validateAndTransformBody(AdminCreateProductOption),
      validateAndTransformQuery(
        AdminGetProductOptionParams,
        QueryConfig.retrieveProductOptionsTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.product_option,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-options/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductOption),
      validateAndTransformQuery(
        AdminGetProductOptionParams,
        QueryConfig.retrieveProductOptionsTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.product_option,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-options/:id",
    middlewares: [],
    policies: [
      {
        resource: Entities.product_option,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
