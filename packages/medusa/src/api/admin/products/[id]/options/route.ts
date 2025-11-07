import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities,
  refetchEntity,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { remapKeysForProduct, remapProductResponse } from "../../helpers"
import { createAndLinkProductOptionsToProductWorkflow } from "@medusajs/core-flows"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductOptionParams>,
  res: MedusaResponse<HttpTypes.AdminProductOptionListResponse>
) => {
  const productId = req.params.id
  const { data: product_options, metadata } = await refetchEntities({
    entity: "product_option",
    idOrFilter: { ...req.filterableFields, products: { id: productId } },
    scope: req.scope,
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_options,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

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
