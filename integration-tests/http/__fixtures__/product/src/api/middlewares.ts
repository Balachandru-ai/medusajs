import {
  defineMiddlewares,
  setContext,
  MedusaRequest,
} from "@medusajs/framework/http"
import { QueryContext } from "@medusajs/utils"

export default defineMiddlewares({
  routes: [
    {
      method: ["GET"],
      matcher: "/store/products/:id",
      middlewares: [
        // Set context from x-query-context header if present (for testing)
        async (req: MedusaRequest, res, next) => {
          const contextHeader = req.get("x-query-context")
          return setContext(JSON.parse(contextHeader ?? "{}"))(req, res, next)
        },
        async (req: MedusaRequest, res, next) => {
          if (req.context?.custom) {
            req.context.custom = QueryContext(req.context.custom)
          }
          next()
        },
      ],
    },
  ],
})
