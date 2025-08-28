import { PromotionActions } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ComputeActionItemLine,
  OrderStatus,
  PromotionDTO,
} from "@medusajs/types"
import {
  refreshDraftOrderAdjustmentsWorkflow
} from "../../../draft-order/workflows/refresh-draft-order-adjustments"
import { previewOrderChangeStep } from "../../steps"

export const refreshOrderEditAdjustmentsWorkflowId =
  "refresh-order-edit-adjustments"

/**
 * The details of the order to refresh the adjustments for.
 */
export interface RefreshOrderEditAdjustmentsWorkflowInput {
  /**
   * The order edit to refresh the adjustments for.
   */
  order: {
    /**
     * The ID of the order.
     */
    id: string
    /**
     * The status of the order.
     */
    status: OrderStatus
    /**
     * The 2 character ISO code for the currency.
     * 
     * @example
     * "usd"
     */
    currency_code: string
    /**
     * The date the order was canceled at.
     */
    canceled_at?: string | Date
    /**
     * The items in the order.
     */
    items: ComputeActionItemLine[]
    /**
     * The promotions applied to the order.
     */
    promotions: PromotionDTO[]
  }
}

/**
 * This workflow refreshes the adjustments for an order edit. It's used by other workflows, such as
 * {@link beginOrderEditOrderWorkflow}.
 * 
 * You can use this workflow within your own customizations or custom workflows, allowing you to wrap custom logic around refreshing adjustments for order edits
 * in your custom flows.
 * 
 * @since 2.10.0
 * 
 * @example
 * const { result } = await refreshOrderEditAdjustmentsWorkflow(container)
 *   .run({
 *     input: {
 *       order: {
 *         id: "order_123",
 *         // Imported from @medusajs/framework/types
 *         status: OrderStatus.PENDING,
 *         currency_code: "usd",
 *         items: [
 *           {
 *             id: "item_1",
 *             quantity: 1,
 *             subtotal: 10,
 *             original_total: 10,
 *             is_discountable: true
 *           }
 *         ],
 *         promotions: [],
 *       },
 *     },
 *   })
 * 
 * @summary
 *
 * Refreshes adjustments for an order edit.
 */
export const refreshOrderEditAdjustmentsWorkflow = createWorkflow(
  refreshOrderEditAdjustmentsWorkflowId,
  function (input: WorkflowData<RefreshOrderEditAdjustmentsWorkflowInput>) {
    const orderEditPromoCodes: string[] = transform({ input }, ({ input }) => {
      return input.order.promotions
        .map((p) => p?.code)
        .filter(Boolean) as string[]
    })

    // we want the previewed order to contain updated promotions,
    // so we fetch it to use it for refreshing adjustments
    const orderPreview = previewOrderChangeStep(input.order.id).config({
      name: "order-preview",
    })

    const orderToRefresh = transform(
      { input, orderPreview },
      ({ input, orderPreview }) => {
        return {
          ...orderPreview,
          items: orderPreview.items.map((item) => ({
            ...item,
            // Buy-Get promotions rely on the product ID, so we need to manually set it before refreshing adjustments
            product: { id: item.product_id },
          })),
          currency_code: input.order.currency_code,
          promotions: input.order.promotions,
        }
      }
    )

    refreshDraftOrderAdjustmentsWorkflow.runAsStep({
      input: {
        order: orderToRefresh,
        promo_codes: orderEditPromoCodes,
        action: PromotionActions.REPLACE,
      },
    })

    return new WorkflowResponse(void 0)
  }
)
