import { listShippingOptionsForOrderWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AdminShippingOption, HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: MedusaRequest<{}, HttpTypes.AdminGetOrderShippingOptionList>,
  res: MedusaResponse<{ shipping_options: AdminShippingOption[] }>
) => {
  const { id } = req.params
  const { is_return, enabled_in_store } = req.filterableFields

  const workflow = listShippingOptionsForOrderWorkflow(req.scope)
  const { result: shipping_options } = await workflow.run({
    input: {
      order_id: id,
      is_return: !!is_return,
      enabled_in_store: enabled_in_store,
    },
  })

  res.json({ shipping_options })
}
