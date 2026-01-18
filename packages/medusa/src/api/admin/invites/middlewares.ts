import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"

import {
  AdminCreateInvite,
  AdminGetInviteAcceptParams,
  AdminGetInviteParams,
  AdminGetInvitesParams,
  AdminInviteAccept,
} from "./validators"

import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import { authenticate } from "../../../utils/middlewares/authenticate-middleware"

// TODO: Due to issues with our routing (and using router.use for applying middlewares), we have to opt-out of global auth in all routes, and then reapply it here.
// See https://medusacorp.slack.com/archives/C025KMS13SA/p1716455350491879 for details.
export const adminInviteRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/invites/*",
    policies: [
      {
        resource: Entities.invite,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/invites",
    middlewares: [
      authenticate("user", ["session", "bearer", "api-key"]),
      validateAndTransformQuery(
        AdminGetInvitesParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/invites",
    middlewares: [
      authenticate("user", ["session", "bearer", "api-key"]),
      validateAndTransformBody(AdminCreateInvite),
      validateAndTransformQuery(
        AdminGetInviteParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.invite,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: "POST",
    matcher: "/admin/invites/accept",
    middlewares: [
      authenticate("user", ["session", "bearer"], {
        allowUnregistered: true,
      }),
      validateAndTransformBody(AdminInviteAccept),
      validateAndTransformQuery(
        AdminGetInviteAcceptParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.invite,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/invites/:id",
    middlewares: [
      authenticate("user", ["session", "bearer", "api-key"]),
      validateAndTransformQuery(
        AdminGetInviteParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/invites/:id",
    middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    policies: [
      {
        resource: Entities.invite,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: "POST",
    matcher: "/admin/invites/:id/resend",
    middlewares: [
      authenticate("user", ["session", "bearer", "api-key"]),
      validateAndTransformQuery(
        AdminGetInviteParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.invite,
        operation: PolicyOperation.update,
      },
    ],
  },
]
