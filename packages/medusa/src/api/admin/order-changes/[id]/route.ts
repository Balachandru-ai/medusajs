import { setCarryOverPromotionFlagForOrderChangeWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"
import { AdminPostOrderChangesReqSchemaType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminPostOrderChangesReqSchemaType>,
  res: MedusaResponse<HttpTypes.AdminOrderChangeResponse>
) => {
  const { id } = req.params
  const { carry_over_promotions } = req.validatedBody

  const workflow = setCarryOverPromotionFlagForOrderChangeWorkflow(req.scope)
  await workflow.run({
    input: {
      order_change_id: id,
      carry_over_promotions,
    },
  })

  const orderChange = await refetchEntity({
    entity: "order_change",
    idOrFilter: id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ order_change: orderChange })
}
