import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { deleteGiftCardsStep } from "../steps/delete-gift-cards"

/*
  A workflow that deletes a gift card
*/
export const deleteGiftCardWorkflowId = "delete-gift-card"
export const deleteGiftCardWorkflow = createWorkflow(
  deleteGiftCardWorkflowId,
  function (input: { id: string }) {
    useQueryGraphStep({
      entity: "gift_card",
      filters: { id: input.id },
      fields: ["id", "status"],
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-gift-card-query" })

    deleteGiftCardsStep({ id: [input.id] })
  }
)
