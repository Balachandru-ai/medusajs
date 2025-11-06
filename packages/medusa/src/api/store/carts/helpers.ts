import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { AuthenticatedMedusaRequest, MedusaStoreRequest } from "@medusajs/framework/http"
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "../../utils/middlewares/products"

export const refetchCart = async (
  id: string,
  scope: MedusaContainer,
  fields: string[],
  req?: AuthenticatedMedusaRequest<any, any> | MedusaStoreRequest<any, any>
) => {
  // Check if inventory_quantity is requested
  const withInventoryQuantity =
    fields.some((field) => field.includes("items.variant.inventory_quantity"))

  // Remove inventory_quantity from fields before fetching (it's computed, not stored)
  // and ensure items.variant is included if not already presents
  const fieldsToFetch = withInventoryQuantity
    ? [...fields.filter((field) => !field.includes("items.variant.inventory_quantity"))]
    : fields

  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id } },
    fields: fieldsToFetch,
  })

  const [cart] = await remoteQuery(queryObject)

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id '${id}' not found`
    )
  }

  // Add inventory_quantity if requested and req context is provided
  if (withInventoryQuantity && cart.items?.length && req) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      cart.items.map((item) => item.variant)
    )
  }

  return cart
}
