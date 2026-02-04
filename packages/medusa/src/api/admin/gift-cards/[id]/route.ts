import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateGiftCardsWorkflow } from "@medusajs/core-flows"
import { AdminUpdateGiftCardType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const {
    data: [gift_card],
  } = await query.graph(
    {
      entity: "gift_cards",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ gift_card })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateGiftCardType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await query.graph(
    {
      entity: "gift_cards",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  const { expires_at, ...rest } = req.validatedBody

  await updateGiftCardsWorkflow(req.scope).run({
    input: [
      {
        id,
        ...rest,
        ...(expires_at !== undefined && {
          expires_at: expires_at === null ? null : new Date(expires_at),
        }),
      },
    ],
  })

  const {
    data: [gift_card],
  } = await query.graph(
    {
      entity: "gift_cards",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ gift_card })
}
