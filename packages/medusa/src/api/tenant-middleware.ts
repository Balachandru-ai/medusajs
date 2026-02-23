import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IStoreModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function tenantMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const host = req.get("host")
  const subdomain = host?.split(".")[0]

  if (!subdomain || subdomain === "www" || subdomain === "api" || subdomain === "admin") {
    return next()
  }

  const storeModuleService: IStoreModuleService = req.scope.resolve(Modules.STORE)

  try {
    const [store] = await storeModuleService.listStores({
      subdomain: subdomain,
    })

    if (store) {
      // Attach store to request for later use in other middlewares or handlers
      (req as any).tenant = store

      // If the store has a default sales channel, we can use it for filtering
      if (store.default_sales_channel_id) {
        req.query = req.query || {}
        // For Store API, we often want to filter by sales channel
        if (req.path.startsWith("/store")) {
          (req.query as any).sales_channel_id = (req.query as any).sales_channel_id || [store.default_sales_channel_id]
        }
      }
    }
  } catch (error) {
    console.error("Error fetching tenant:", error)
  }

  next()
}
