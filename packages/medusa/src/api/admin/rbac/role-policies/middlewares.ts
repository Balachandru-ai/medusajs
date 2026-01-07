import * as QueryConfig from "./query-config"

import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"

import {
  AdminCreateRbacRolePolicy,
  AdminGetRbacRolePoliciesParams,
  AdminGetRbacRolePolicyParams,
  AdminUpdateRbacRolePolicy,
} from "./validators"

export const adminRbacRolePolicyRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/rbac/role-policies",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRbacRolePoliciesParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/rbac/role-policies/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRbacRolePolicyParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/rbac/role-policies",
    middlewares: [
      validateAndTransformBody(AdminCreateRbacRolePolicy),
      validateAndTransformQuery(
        AdminGetRbacRolePolicyParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/rbac/role-policies/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateRbacRolePolicy),
      validateAndTransformQuery(
        AdminGetRbacRolePolicyParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/rbac/role-policies/:id",
    middlewares: [],
  },
]
