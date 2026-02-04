import { LoyaltyTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const deleteGiftCardsStepId = "delete-gift-cards"
export const deleteGiftCardsStep = createStep(
  deleteGiftCardsStepId,
  async function ({ id }: { id: string[] }, { container }) {
    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    await module.softDeleteGiftCards(id)

    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (!id?.length) {
      return
    }

    const module = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    await module.restoreGiftCards(id)
  }
)
