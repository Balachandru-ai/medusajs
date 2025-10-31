import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import {
  AdminCreateTenant,
  AdminUpdateTenant,
  AdminTenantParams,
} from "./validators"

export const adminTenantRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/tenants",
    middlewares: [
      validateAndTransformBody(AdminCreateTenant),
    ],
  },
  {
    method: ["GET", "POST", "DELETE"],
    matcher: "/admin/tenants/:id",
    middlewares: [
      validateAndTransformQuery(AdminTenantParams),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/tenants/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateTenant),
    ],
  },
]
