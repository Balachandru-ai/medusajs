import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import { authenticate } from "../../../utils/middlewares/authenticate-middleware"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminGetUserParams,
  AdminGetUsersParams,
  AdminUpdateUser,
} from "./validators"

// TODO: Due to issues with our routing (and using router.use for applying middlewares), we have to opt-out of global auth in all routes, and then reapply it here.
// See https://medusacorp.slack.com/archives/C025KMS13SA/p1716455350491879 for details.
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
      authenticate("user", ["bearer", "session"]),
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
      authenticate("user", ["bearer", "session"]),
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
      authenticate("user", ["bearer", "session"]),
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
      authenticate("user", ["bearer", "session"]),
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
    middlewares: [authenticate("user", ["bearer", "session"])],
    policies: [
      {
        resource: Entities.user,
        operation: PolicyOperation.delete,
      },
    ],
  },
]
