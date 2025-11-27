import { OrderChangeDTO, UpdateOrderChangeDTO } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { updateOrderChangesStep } from "../steps/update-order-changes"
import { setCarryOverPromotionFlagForOrderChangeWorkflow } from "./set-carry-over-promotion-flag"

export const updateOrderChangeWorkflowId = "update-order-change-workflow"

/**
 * This workflow updates an order change.
 * If the carry_over_promotions flag is provided, it calls setCarryOverPromotionFlagForOrderChangeWorkflow
 * to handle the promotion logic. Otherwise, it updates the order change directly.
 *
 * @example
 * const { result } = await updateOrderChangeWorkflow(container)
 * .run({
 *   input: {
 *     id: "orch_123",
 *     carry_over_promotions: true,
 *   }
 * })
 *
 * @summary
 *
 * Update an order change, conditionally handling promotion carry-over if specified.
 */
export const updateOrderChangeWorkflow = createWorkflow(
  updateOrderChangeWorkflowId,
  function (
    input: WorkflowData<UpdateOrderChangeDTO>
  ): WorkflowResponse<OrderChangeDTO> {
    // Check if carry_over_promotions is provided (not null/undefined)
    const hasCarryOverPromotions = transform(
      { input },
      ({ input }) =>
        input.carry_over_promotions !== null &&
        input.carry_over_promotions !== undefined
    )

    // If carry_over_promotions is provided, call the dedicated workflow
    const promotionWorkflowResult = when(
      "should-call-carry-over-promotion-workflow",
      { hasCarryOverPromotions },
      ({ hasCarryOverPromotions }) => hasCarryOverPromotions
    ).then(() => {
      // Call the carry over promotion workflow which returns the updated order change
      return setCarryOverPromotionFlagForOrderChangeWorkflow.runAsStep({
        input: {
          order_change_id: input.id,
          carry_over_promotions: input.carry_over_promotions!,
        },
      })
    })

    const updatedOrderChanges = when(
      "should-update-order-change-directly",
      { hasCarryOverPromotions },
      // TODO: update this condition when other fileds can be updated with the flow
      ({ hasCarryOverPromotions }) => !hasCarryOverPromotions
    ).then(() => {
      return updateOrderChangesStep([input])
    })

    const updatedOrderChange = transform(
      { promotionWorkflowResult, updatedOrderChanges },
      ({ promotionWorkflowResult, updatedOrderChanges }) =>
        (promotionWorkflowResult ?? updatedOrderChanges?.[0]) as OrderChangeDTO
    )

    return new WorkflowResponse(updatedOrderChange)
  }
)
