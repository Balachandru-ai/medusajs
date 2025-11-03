import { updateCartWorkflowId } from "@medusajs/core-flows"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"

import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { refetchCart } from "../helpers"
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "../../../utils/middlewares/products"

export const GET = async (
  req: MedusaStoreRequest<HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {

  const withInventoryQuantity =
    req.queryConfig.fields.some((field) => field.includes("items.variant")) &&
    req.queryConfig.fields.some((field) => field.includes("items.variant.inventory_quantity"))


  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter((field) => !field.includes("items.variant.inventory_quantity"))
  }

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(req, cart.items.map((item) => item.variant))
  }

  res.json({ cart })
}

export const POST = async (
  req: MedusaStoreRequest<
    HttpTypes.StoreUpdateCart & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<{
    cart: HttpTypes.StoreCart
  }>
) => {
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE)

  await we.run(updateCartWorkflowId, {
    input: {
      ...req.validatedBody,
      id: req.params.id,
      additional_data: req.validatedBody.additional_data,
    },
  })

  const withInventoryQuantity =
    req.queryConfig.fields.some((field) => field.includes("items.variant")) &&
    req.queryConfig.fields.some((field) => field.includes("items.variant.inventory_quantity"))

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter((field) => !field.includes("items.variant.inventory_quantity"))
  }

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(req, cart.items.map((item) => item.variant))
  }

  res.status(200).json({ cart })
}
