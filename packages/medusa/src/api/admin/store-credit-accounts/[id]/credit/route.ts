import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { creditAccountsWorkflow } from "@medusajs/core-flows"
import { AdminCreditStoreCreditAccountParamsType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreditStoreCreditAccountParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await creditAccountsWorkflow(req.scope).run({
    input: [
      {
        account_id: id,
        amount: req.validatedBody.amount,
        note: req.validatedBody.note,
        reference: req.auth_context.actor_type,
        reference_id: req.auth_context.actor_id,
      },
    ],
  })

  const {
    data: [store_credit_account],
  } = await query.graph(
    {
      entity: "store_credit_account",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ store_credit_account })
}
