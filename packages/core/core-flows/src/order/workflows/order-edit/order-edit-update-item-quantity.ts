import {
  ComputeActionContext,
  OrderChangeDTO,
  OrderDTO,
  OrderPreviewDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import {
  BigNumber,
  ChangeActionType,
  getLineItemTotals,
  MathBN,
  OrderChangeStatus,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  getActionsToComputeFromPromotionsStep,
  prepareAdjustmentsFromPromotionActionsStep,
} from "../../.."
import { useQueryGraphStep } from "../../../common"
import { previewOrderChangeStep } from "../../steps/preview-order-change"
import {
  throwIfIsCancelled,
  throwIfOrderChangeIsNotActive,
} from "../../utils/order-validation"
import { createOrderChangeActionsWorkflow } from "../create-order-change-actions"
import { computeAdjustmentsForPreviewWorkflow } from "./compute-adjustments-for-preview"
import { fieldsToRefreshOrderEdit } from "./utils/fields"

/**
 * The data to validate that the quantity of an existing item in an order can be updated in an order edit.
 */
export type OrderEditUpdateItemQuantityValidationStepInput = {
  /**
   * The order's details.
   */
  order: OrderDTO
  /**
   * The order change's details.
   */
  orderChange: OrderChangeDTO
}

/**
 * This step validates that the quantity of an existing item in an order can be updated in an order edit.
 * If the order is canceled or the order change is not active, the step will throw an error.
 *
 * :::note
 *
 * You can retrieve an order and order change details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 *
 * :::
 *
 * @example
 * const data = orderEditUpdateItemQuantityValidationStep({
 *   order: {
 *     id: "order_123",
 *     // other order details...
 *   },
 *   orderChange: {
 *     id: "orch_123",
 *     // other order change details...
 *   }
 * })
 */
export const orderEditUpdateItemQuantityValidationStep = createStep(
  "order-edit-update-item-quantity-validation",
  async function ({
    order,
    orderChange,
  }: OrderEditUpdateItemQuantityValidationStepInput) {
    throwIfIsCancelled(order, "Order")
    throwIfOrderChangeIsNotActive({ orderChange })
  }
)

export const orderEditUpdateItemQuantityWorkflowId =
  "order-edit-update-item-quantity"
/**
 * This workflow updates the quantity of an existing item in an order's edit. It's used by the
 * [Update Order Item Quantity Admin API Route](https://docs.medusajs.com/api/admin#order-edits_postordereditsiditemsitemitem_id).
 *
 * This workflow is different from the `updateOrderEditItemQuantityWorkflow` workflow in that this should be used
 * when the item to update was part of the original order before the edit. The other workflow is for items
 * that were added to the order as part of the edit.
 *
 * You can also use this workflow to remove an item from an order by setting its quantity to `0`.
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to update the quantity of an existing
 * item in an order's edit in your custom flow.
 *
 * @example
 * const { result } = await orderEditUpdateItemQuantityWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     items: [
 *       {
 *         id: "orli_123",
 *         quantity: 2,
 *       }
 *     ]
 *   }
 * })
 *
 * @summary
 *
 * Update or remove an existing order item's quantity in the order's edit.
 */
export const orderEditUpdateItemQuantityWorkflow = createWorkflow(
  orderEditUpdateItemQuantityWorkflowId,
  function (
    input: WorkflowData<OrderWorkflow.OrderEditUpdateItemQuantityWorkflowInput>
  ): WorkflowResponse<OrderPreviewDTO> {
    const orderResult = useQueryGraphStep({
      entity: "order",
      fields: fieldsToRefreshOrderEdit,
      filters: { id: input.order_id },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "order-query" })

    const order = transform({ orderResult }, ({ orderResult }) => {
      return orderResult.data[0]
    })

    const orderChangeResult = useQueryGraphStep({
      entity: "order_change",
      fields: ["id", "status", "version", "actions.*"],
      filters: {
        order_id: input.order_id,
        status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
      },
    }).config({ name: "order-change-query" })

    const orderChange = transform(
      { orderChangeResult },
      ({ orderChangeResult }) => {
        return orderChangeResult.data[0]
      }
    )

    orderEditUpdateItemQuantityValidationStep({
      order,
      orderChange,
    })

    const actionsToComputeItemsInput = transform(
      { order, items: input.items },
      ({ order, items }) => {
        const itemsToComputeFor = order.items.map((item) => {
          const updatedItem = items.find((i) => i.id === item.id)

          const itemTotals = getLineItemTotals(
            {
              id: item.id,
              unit_price: item.unit_price,
              quantity: updatedItem?.quantity ?? item.quantity,
              is_tax_inclusive: item.is_tax_inclusive,
              tax_lines: item.tax_lines,
              adjustments: item.adjustments,
              detail: item.detail,
            },
            {}
          )

          return {
            id: item.id,
            quantity: updatedItem?.quantity ?? item.quantity,
            subtotal: itemTotals.subtotal,
            original_total: itemTotals.original_total,
            is_discountable: item.is_discountable,
            adjustments: item.adjustments,
            product: { id: item.product_id },
          }
        })

        return {
          currency_code: order.currency_code,
          items: itemsToComputeFor,
        } as ComputeActionContext
      }
    )

    const orderPromotions = transform({ order }, ({ order }) => {
      return order.promotions.map((p) => p.code).filter((p) => p !== undefined)
    })

    const actions = getActionsToComputeFromPromotionsStep({
      computeActionContext: actionsToComputeItemsInput,
      promotionCodesToApply: orderPromotions,
    })

    const { lineItemAdjustmentsToCreate, lineItemAdjustmentIdsToRemove } =
      prepareAdjustmentsFromPromotionActionsStep({ actions })

    const orderChangeActionInput = transform(
      {
        order,
        orderChange,
        items: input.items,
        lineItemAdjustmentsToCreate,
        lineItemAdjustmentIdsToRemove,
      },
      ({
        order,
        orderChange,
        items,
        lineItemAdjustmentsToCreate,
        lineItemAdjustmentIdsToRemove,
      }) => {
        const itemsUpdates = items.map((item) => {
          const existing = order?.items?.find(
            (exItem) => exItem.id === item.id
          )!

          const quantityDiff = new BigNumber(
            MathBN.sub(item.quantity, existing.quantity)
          )

          return {
            order_change_id: orderChange.id,
            order_id: order.id,
            version: orderChange.version,
            action: ChangeActionType.ITEM_UPDATE,
            internal_note: item.internal_note,
            details: {
              reference_id: item.id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              compare_at_unit_price: item.compare_at_unit_price,
              quantity_diff: quantityDiff,
              // adjustments_to_create: lineItemAdjustmentsToCreate.filter(
              //   (adjustment) => adjustment.item_id === item.id
              // ),
              // adjustments_to_remove: lineItemAdjustmentIdsToRemove.filter(
              //   (adjustmentId) => adjustmentId === item.id
              // ),
            },
          }
        })

        // const itemAdjustmentsUpdate = {
        //   order_change_id: orderChange.id,
        //   order_id: order.id,
        //   version: orderChange.version,
        //   action: ChangeActionType.ITEM_ADJUSTMENTS_REPLACE,
        //   details: {
        //     adjustments_to_create: lineItemAdjustmentsToCreate,
        //     adjustments_to_remove: lineItemAdjustmentIdsToRemove,
        //   },
        // }

        return [...itemsUpdates]
      }
    )

    createOrderChangeActionsWorkflow.runAsStep({
      input: orderChangeActionInput,
    })

    computeAdjustmentsForPreviewWorkflow.runAsStep({
      input: {
        order,
        orderChange,
      },
    })

    return new WorkflowResponse(previewOrderChangeStep(input.order_id))
  }
)
