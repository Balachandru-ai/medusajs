import { setCarryOverPromotionFlagForOrderChangeWorkflow } from "@medusajs/core-flows"
import { HttpTypes, RemoteQueryFunction } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminPostOrderChangesReqSchemaType } from "../validators"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminPostOrderChangesReqSchemaType>,
  res: MedusaResponse<HttpTypes.AdminOrderChangeResponse>
) => {
  const { id } = req.params
  const { carry_over_promotions } = req.validatedBody
  const queryGraph = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  )

  const workflow = setCarryOverPromotionFlagForOrderChangeWorkflow(req.scope)
  await workflow.run({
    input: {
      order_change_id: id,
      carry_over_promotions,
    },
  })

  const orderChange = await queryGraph.graph({
    entity: "order_change",
    filters: {
      ...req.filterableFields,
      id,
    },
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ order_change: orderChange.data[0] })
}
