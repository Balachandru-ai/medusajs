import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  AdminStoreCreditAccount,
  AdminStoreCreditAccountListResponse,
  ILoyaltyModuleService,
} from "@medusajs/framework/types"
import { createStoreCreditAccountsWorkflow } from "@medusajs/core-flows"
import {
  AdminCreateStoreCreditAccountType,
  AdminGetStoreCreditAccountsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetStoreCreditAccountsParamsType>,
  res: MedusaResponse<AdminStoreCreditAccountListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const loyaltyModule = req.scope.resolve<ILoyaltyModuleService>(
    Modules.LOYALTY
  )

  const { fields, pagination } = req.queryConfig
  const { data: accounts, metadata } = await query.graph({
    entity: "store_credit_account",
    fields,
    filters: { ...req.filterableFields },
    pagination: {
      ...pagination,
      skip: pagination.skip!,
    },
  })

  const finalStoreCreditAccounts: AdminStoreCreditAccount[] = []

  for (const store_credit_account of accounts) {
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

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateStoreCreditAccountType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    result: [storeCreditAccount],
  } = await createStoreCreditAccountsWorkflow(req.scope).run({
    input: [{ ...req.validatedBody }],
  })

  const {
    data: [store_credit_account],
  } = await query.graph(
    {
      entity: "store_credit_account",
      fields: req.queryConfig.fields,
      filters: { id: storeCreditAccount.id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ store_credit_account })
}
