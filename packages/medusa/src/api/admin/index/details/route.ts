import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { HttpTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Get the index information for all entities that are indexed and their sync state
 * @param req
 * @param res
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<void>,
  res: MedusaResponse<HttpTypes.AdminIndexDetailsResponse>
) => {
  const indexModuleService = req.scope.resolve(Modules.INDEX)
  const indexInfo = await indexModuleService.getInfo()
  res.json({
    metadata: indexInfo,
  })
}
