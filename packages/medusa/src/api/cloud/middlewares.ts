import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { CreateCloudAuthUserSchema } from "./auth/users/route"

export const cloudRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/cloud/auth/users",
    method: ["POST"],
    middlewares: [
      // Allow users who are authenticated but don't yet have an actor (user record)
      authenticate("user", "bearer", {
        allowUnregistered: true,
      }),
      validateAndTransformBody(CreateCloudAuthUserSchema),
    ],
  },
]
