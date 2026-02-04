import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  ILoyaltyModuleService,
  StoreStoreCreditAccount,
  StoreStoreCreditAccountListResponse,
} from "@medusajs/framework/types"
import { StoreGetStoreCreditAccountsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetStoreCreditAccountsParamsType>,
  res: MedusaResponse<StoreStoreCreditAccountListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const loyaltyModule = req.scope.resolve<ILoyaltyModuleService>(
    Modules.LOYALTY
  )

  const { fields, pagination } = req.queryConfig
  const { data: store_credit_accounts, metadata } = await query.graph({
    entity: "store_credit_account",
    fields,
    filters: {
      ...req.filterableFields,
      customer_id: req.auth_context.actor_id,
    },
    pagination: {
      ...pagination,
      skip: pagination.skip!,
    },
  })

  const finalStoreCreditAccounts: StoreStoreCreditAccount[] = []

  for (const store_credit_account of store_credit_accounts) {
    const accountStats = await loyaltyModule.retrieveAccountStats({
      account_id: store_credit_account.id,
    })

    finalStoreCreditAccounts.push({
      ...store_credit_account,
      ...accountStats,
    })
  }

  res.json({
    store_credit_accounts: finalStoreCreditAccounts,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
