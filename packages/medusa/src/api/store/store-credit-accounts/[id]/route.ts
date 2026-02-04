import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ILoyaltyModuleService } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const loyaltyModule = req.scope.resolve<ILoyaltyModuleService>(
    Modules.LOYALTY
  )

  const {
    data: [store_credit_account],
  } = await query.graph(
    {
      entity: "store_credit_account",
      fields: req.queryConfig.fields,
      filters: {
        id,
        customer_id: req.auth_context.actor_id,
      },
    },
    { throwIfKeyNotFound: true }
  )

  // TODO: We should inject this into the module list and retrieve services
  // and allow scoping that through remote query
  const accountStats = await loyaltyModule.retrieveAccountStats({
    account_id: id,
  })

  res.json({
    store_credit_account: {
      ...store_credit_account,
      ...accountStats,
    },
  })
}
