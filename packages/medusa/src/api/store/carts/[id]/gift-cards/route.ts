import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"
import {
  addGiftCardToCartWorkflow,
  removeGiftCardFromCartWorkflow,
} from "@medusajs/core-flows"
import {
  StoreAddGiftCardToCartType,
  StoreRemoveGiftCardFromCartType,
} from "../../validators"

export const POST = async (
  req: MedusaRequest<StoreAddGiftCardToCartType>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await addGiftCardToCartWorkflow(req.scope).run({
    input: {
      cart_id: id,
      ...req.validatedBody,
    },
  })

  const {
    data: [cart],
  } = await query.graph(
    {
      entity: "cart",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ cart })
}

export const DELETE = async (
  req: MedusaRequest<StoreRemoveGiftCardFromCartType>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await removeGiftCardFromCartWorkflow(req.scope).run({
    input: {
      cart_id: id,
      ...req.validatedBody,
    },
  })

  const {
    data: [cart],
  } = await query.graph(
    {
      entity: "cart",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ cart })
}
