import { listShippingOptionsForOrderWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AdminShippingOption, HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: MedusaRequest<{}, HttpTypes.AdminGetOrderShippingOptionList>,
  res: MedusaResponse<{ shipping_options: AdminShippingOption[] }>
) => {
  const { id } = req.params

  const workflow = listShippingOptionsForOrderWorkflow(req.scope)
  const { result: shipping_options } = await workflow.run({
    input: {
      order_id: id,
    },
  })

  res.json({ shipping_options })
}
