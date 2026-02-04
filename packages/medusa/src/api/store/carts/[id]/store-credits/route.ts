import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"
import { addStoreCreditsToCartWorkflow } from "@medusajs/core-flows"
import { StoreAddStoreCreditsToCartType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreAddStoreCreditsToCartType>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await addStoreCreditsToCartWorkflow(req.scope).run({
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
