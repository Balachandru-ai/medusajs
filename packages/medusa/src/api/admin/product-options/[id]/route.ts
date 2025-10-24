import {
  deleteProductOptionsWorkflow,
  updateProductOptionsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"

import {
  AdminGetProductOptionParamsType,
  AdminUpdateProductOptionType,
} from "../validators"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetProductOptionParamsType>,
  res: MedusaResponse<HttpTypes.AdminProductOptionResponse>
) => {
  const product_option = await refetchEntity({
    entity: "product_option",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ product_option })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateProductOptionType>,
  res: MedusaResponse<HttpTypes.AdminProductOptionResponse>
) => {
  const existingProductOption = await refetchEntity({
    entity: "product_option",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: ["id"],
  })

  if (!existingProductOption) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product option with id "${req.params.id}" not found`
    )
  }

  const { result } = await updateProductOptionsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: req.validatedBody,
    },
  })

  const product_option = await refetchEntity({
    entity: "product_option",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ product_option })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductOptionDeleteResponse>
) => {
  const id = req.params.id

  await deleteProductOptionsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "product_option",
    deleted: true,
  })
}
