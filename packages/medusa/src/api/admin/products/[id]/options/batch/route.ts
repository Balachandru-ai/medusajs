import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { createAndLinkProductOptionsToProductWorkflow } from "@medusajs/core-flows"
import { remapKeysForProduct, remapProductResponse } from "../../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminLinkProductOptions>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const productId = req.params.id

  await createAndLinkProductOptionsToProductWorkflow(req.scope).run({
    input: {
      product_id: productId,
      ...req.validatedBody,
    },
  })

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: productId,
    scope: req.scope,
    fields: remapKeysForProduct(req.queryConfig.fields ?? []),
  })

  res.status(200).json({ product: remapProductResponse(product) })
}
