import { addToCartWorkflowId } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/utils"
import { refetchCart } from "../../helpers"
import { StoreAddCartLineItemType } from "../../validators"

export const POST = async (
  req: MedusaRequest<StoreAddCartLineItemType>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  await we.run(addToCartWorkflowId, {
    input: {
      cart_id: req.params.id,
      items: [req.validatedBody],
    },
    transactionId: "cart-add-item-" + req.params.id,
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
