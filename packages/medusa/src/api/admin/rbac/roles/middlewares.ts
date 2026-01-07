import * as QueryConfig from "./query-config"

import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import {
  AdminCreateRbacRole,
  AdminGetRbacRoleParams,
  AdminGetRbacRolesParams,
  AdminUpdateRbacRole,
} from "./validators"

export const adminRbacRoleRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/rbac/roles",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRbacRolesParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/rbac/roles/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRbacRoleParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/rbac/roles",
    middlewares: [
      validateAndTransformBody(AdminCreateRbacRole),
      validateAndTransformQuery(
        AdminGetRbacRoleParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/rbac/roles/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateRbacRole),
      validateAndTransformQuery(
        AdminGetRbacRoleParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/rbac/roles/:id",
    middlewares: [],
  },
]
