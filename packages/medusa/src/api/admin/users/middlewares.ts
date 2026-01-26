import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminGetUserParams,
  AdminGetUsersParams,
  AdminUpdateUser,
} from "./validators"

export const adminUserRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/users/*",
    policies: [
      {
        resource: Entities.user,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/users",
    middlewares: [
      validateAndTransformQuery(
        AdminGetUsersParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/users/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetUserParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/users/me",
    middlewares: [
      validateAndTransformQuery(
        AdminGetUserParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/users/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateUser),
      validateAndTransformQuery(
        AdminGetUserParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.user,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/users/:id",
    policies: [
      {
        resource: Entities.user,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
