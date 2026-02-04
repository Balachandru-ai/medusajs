import { LoyaltyTypes } from "@medusajs/framework/types"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateGiftCardsStep } from "../steps/update-gift-cards"

/*
  A workflow that updates gift cards.
*/
export const updateGiftCardsWorkflowId = "update-gift-cards-workflow"
export const updateGiftCardsWorkflow = createWorkflow(
  updateGiftCardsWorkflowId,
  function (input: LoyaltyTypes.UpdateGiftCardDTO[]): WorkflowResponse<LoyaltyTypes.GiftCardDTO[]> {
    return new WorkflowResponse(updateGiftCardsStep(input))
  }
)
