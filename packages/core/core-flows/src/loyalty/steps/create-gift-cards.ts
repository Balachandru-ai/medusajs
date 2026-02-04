import { LoyaltyTypes } from "@medusajs/framework/types"
import { generateCode, isPresent, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const createGiftCardsStepId = "create-gift-cards"
export const createGiftCardsStep = createStep(
  createGiftCardsStepId,
  async (input: LoyaltyTypes.CreateGiftCardDTO[], { container }) => {
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    for (const giftCard of input) {
      if (!isPresent(giftCard.code)) {
        giftCard.code = generateCode()
      }
    }

    const giftCards = await module.createGiftCards(input)

    return new StepResponse(
      giftCards,
      giftCards.map((gc) => gc.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }

    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    await module.deleteGiftCards(ids)
  }
)
