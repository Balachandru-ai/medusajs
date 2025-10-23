import {
  ComputeActionContext,
  OrderChangeDTO,
  OrderDTO,
  PromotionDTO,
} from "@medusajs/framework/types"
import { ChangeActionType } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"
import {
  getActionsToComputeFromPromotionsStep,
  prepareAdjustmentsFromPromotionActionsStep,
} from "../../../cart"
import { previewOrderChangeStep } from "../../steps/preview-order-change"
import { createOrderChangeActionsWorkflow } from "../create-order-change-actions"

/**
 * The data to validate that new items can be added to an order edit.
 */
export type ComputeAdjustmentsForPreviewWorkflowInput = {
  /**
   * The order's details.
   */
  order: OrderDTO & { promotions: PromotionDTO[] }
  /**
   * The order change's details.
   */
  orderChange: OrderChangeDTO
}

export const computeAdjustmentsForPreviewWorkflowId =
  "compute-adjustments-for-preview"
/**
 * This workflow computes adjustments for an order edit. It's used by the
 * [Add Items to Order Edit Admin API Route](https://docs.medusajs.com/api/admin#order-edits_postordereditsiditems).
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to compute adjustments for an order edit
 * in your custom flows.
 *
 * @example
 * const { result } = await computeAdjustmentsForPreviewWorkflow(container)
 * .run({
 *   input: {
 *     order: {
 *       id: "order_123",
 *       // other order details...
 *     },
 *     orderChange: {
 *       id: "orch_123",
 *       // other order change details...
 *     }
 *   }
 * })
 *
 * @summary
 *
 * Compute adjustments for an order edit.
 */
export const computeAdjustmentsForPreviewWorkflow = createWorkflow(
  computeAdjustmentsForPreviewWorkflowId,
  function (input: WorkflowData<ComputeAdjustmentsForPreviewWorkflowInput>) {
    const previewedOrder = previewOrderChangeStep(input.order.id)

    when({ order: input.order }, ({ order }) => !!order.promotions.length).then(
      () => {
        const actionsToComputeItemsInput = transform(
          { previewedOrder, order: input.order },
          ({ previewedOrder, order }) => {
            return {
              currency_code: order.currency_code,
              items: previewedOrder.items.map((item) => ({
                ...item,
                // Buy-Get promotions rely on the product ID, so we need to manually set it before refreshing adjustments
                product: { id: item.product_id },
              })),
            } as ComputeActionContext
          }
        )

        const orderPromotions = transform(
          { order: input.order },
          ({ order }) => {
            return order.promotions
              .map((p) => p.code)
              .filter((p) => p !== undefined)
          }
        )

        const actions = getActionsToComputeFromPromotionsStep({
          computeActionContext: actionsToComputeItemsInput,
          promotionCodesToApply: orderPromotions,
        })

        const { lineItemAdjustmentsToCreate } =
          prepareAdjustmentsFromPromotionActionsStep({ actions })

        const orderChangeActionAdjustmentsInput = transform(
          {
            order: input.order,
            previewedOrder,
            orderChange: input.orderChange,
            lineItemAdjustmentsToCreate,
          },
          ({
            order,
            previewedOrder,
            orderChange,
            lineItemAdjustmentsToCreate,
          }) => {
            return previewedOrder.items.map((item) => {
              const itemAdjustments = lineItemAdjustmentsToCreate.filter(
                (adjustment) => adjustment.item_id === item.id
              )

              return {
                order_change_id: orderChange.id,
                order_id: order.id,
                version: orderChange.version,
                action: ChangeActionType.ITEM_ADJUSTMENTS_REPLACE,
                details: {
                  reference_id: item.id,
                  adjustments: itemAdjustments,
                },
              }
            })
          }
        )

        createOrderChangeActionsWorkflow
          .runAsStep({ input: orderChangeActionAdjustmentsInput })
          .config({ name: "order-change-action-adjustments-input" })
      }
    )
  }
)
