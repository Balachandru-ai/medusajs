import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreCollectionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: collection } = await query.graph(
    {
      entity: "product_collection",
      filters: { id: req.params.id },
      fields: req.queryConfig.fields,
    },
    {
      locale: req.locale,
    }
  )

  res.status(200).json({ collection: collection[0] })
}
