import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities,
  refetchEntity,
} from "@medusajs/framework/http"

import { createProductOptionsWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductOptionListParams>,
  res: MedusaResponse<HttpTypes.AdminProductOptionListResponse>
) => {
  const { data: product_options, metadata } = await refetchEntities({
    entity: "product_option",
    idOrFilter: req.filterableFields,
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
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCreateProductOption>,
  res: MedusaResponse<HttpTypes.AdminProductOptionResponse>
) => {
  const input = [req.validatedBody]

  const { result } = await createProductOptionsWorkflow(req.scope).run({
    input: { product_options: input },
  })

  const productOption = await refetchEntity({
    entity: "product_option",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ product_option: productOption })
}
