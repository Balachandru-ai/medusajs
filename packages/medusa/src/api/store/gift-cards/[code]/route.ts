import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { StoreGetGiftCardParams } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<null, StoreGetGiftCardParams>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { code } = req.params

  if (!code?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      "Code is required"
    )
  }

  const {
    data: [gift_card],
  } = await query.graph({
    entity: "gift_cards",
    fields: req.queryConfig.fields,
    filters: {
      code,
    },
  })

  if (!gift_card) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Gift card not found")
  }

  res.json({ gift_card })
}
