import { OrderChangeDTO, UpdateOrderChangeDTO } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { updateOrderChangesStep } from "../steps/update-order-changes"
import { onCarryPromotionsFlagSet } from "./on-carry-promotions-flag-set"

export const updateOrderChangeWorkflowId = "update-order-change-workflow"

/**
 * This workflow updates an order change.
 * If the carry_over_promotions flag is provided, it calls onCarryPromotionsFlagSet
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
    const updatedOrderChange = updateOrderChangesStep([input])

    when(
      "should-call-carry-over-promotion-workflow",
      input,
      ({ carry_over_promotions }) => typeof carry_over_promotions === "boolean"
    ).then(() => {
      return onCarryPromotionsFlagSet.runAsStep({
        input: {
          order_change_id: input.id,
          carry_over_promotions: input.carry_over_promotions!,
        },
      })
    })

    return new WorkflowResponse(
      transform(
        { updatedOrderChange },
        ({ updatedOrderChange }) => updatedOrderChange?.[0]
      )
    )
  }
)
