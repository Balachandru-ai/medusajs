import { LoyaltyTypes } from "@medusajs/framework/types"
import {
  convertItemResponseToUpdateRequest,
  getSelectsAndRelationsFromObjectArray,
  Modules,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/*
  A step to update gift cards.

  The first function attempts to update gift cards, while the second function attempts to revert the update.
  The first function is also in charge of preparing the data to be reverted in the second function.
*/
export const updateGiftCardsStepId = "update-gift-cards"
export const updateGiftCardsStep = createStep(
  updateGiftCardsStepId,
  async (data: LoyaltyTypes.UpdateGiftCardDTO[], { container }) => {
    const loyaltyModule = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )
    const { selects, relations } = getSelectsAndRelationsFromObjectArray(data)

    const dataBeforeUpdate = await loyaltyModule.listGiftCards(
      { id: data.map((d) => d.id) },
      { relations, select: selects }
    )

    const updatedGiftCards = await loyaltyModule.updateGiftCards(data)

    return new StepResponse(updatedGiftCards, {
      dataBeforeUpdate,
      selects,
      relations,
    })
  },
  async (revertInput, { container }) => {
    if (!revertInput) {
      return
    }

    const { dataBeforeUpdate, selects, relations } = revertInput
    const loyaltyModule = container.resolve<LoyaltyTypes.ILoyaltyModuleService>(
      Modules.LOYALTY
    )

    const revertData = dataBeforeUpdate.map((data) =>
      convertItemResponseToUpdateRequest(data, selects, relations)
    )

    if (revertData.length) {
      await loyaltyModule.updateGiftCards(revertData)
    }
  }
)
