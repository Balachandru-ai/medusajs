import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError, QueryContext } from "@medusajs/framework/utils"
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "../../../utils/middlewares"
import { StoreRequestWithContext } from "../../types"
import { wrapVariantsWithTaxPrices } from "../helpers"
import { StoreProductVariantParamsType } from "../validators"

type StoreVariantRetrieveRequest =
  StoreRequestWithContext<HttpTypes.StoreProductVariantParams> &
    AuthenticatedMedusaRequest<StoreProductVariantParamsType>

export const GET = async (
  req: StoreVariantRetrieveRequest,
  res: MedusaResponse<HttpTypes.StoreProductVariantResponse>
) => {
  const withInventoryQuantity =
    req.queryConfig.fields.includes("inventory_quantity")

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => field !== "inventory_quantity"
    )
  }

  const idOrFilter: Record<string, unknown> = {
    ...req.filterableFields,
    id: req.params.id,
  }

  if (req.pricingContext) {
    idOrFilter.context = {
      calculated_price: QueryContext(req.pricingContext),
    }
  }

  const variant = await refetchEntity({
    entity: "variant",
    idOrFilter,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  if (!variant) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product variant with id: ${req.params.id} was not found`
    )
  }

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(req, [variant])
  }

  await wrapVariantsWithTaxPrices(req, [variant])

  res.json({ variant })
}
