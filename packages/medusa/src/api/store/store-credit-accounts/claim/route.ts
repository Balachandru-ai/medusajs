import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { claimStoreCreditAccountWorkflow } from "@medusajs/core-flows"
import { StoreClaimStoreCreditAccountParamsType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreClaimStoreCreditAccountParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await claimStoreCreditAccountWorkflow(req.scope).run({
    input: {
      code: req.validatedBody.code,
      customer_id: req.auth_context.actor_id,
    },
  })

  const {
    data: [store_credit_account],
  } = await query.graph({
    entity: "store_credit_account",
    fields: ["id", "code", "customer_id", "currency_code", "balance"],
    filters: { code: req.validatedBody.code },
  })

  res.json({
    store_credit_account,
  })
}
