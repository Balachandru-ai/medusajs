import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createGiftCardsWorkflow } from "@medusajs/core-flows"
import {
  AdminCreateGiftCardType,
  AdminGetGiftCardsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetGiftCardsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { fields, pagination } = req.queryConfig
  const { data: gift_cards, metadata } = await query.graph({
    entity: "gift_cards",
    fields,
    filters: {
      ...req.filterableFields,
    },
    pagination: {
      ...pagination,
      skip: pagination.skip!,
    },
  })

  res.json({
    gift_cards,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateGiftCardType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { expires_at, ...rest } = req.validatedBody

  const {
    result: [giftCard],
  } = await createGiftCardsWorkflow(req.scope).run({
    input: [
      {
        ...rest,
        expires_at: expires_at ? new Date(expires_at) : undefined,
      },
    ],
  })

  const {
    data: [gift_card],
  } = await query.graph(
    {
      entity: "gift_cards",
      fields: req.queryConfig.fields,
      filters: { id: giftCard.id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ gift_card })
}
