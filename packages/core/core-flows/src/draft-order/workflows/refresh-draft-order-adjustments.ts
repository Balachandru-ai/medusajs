import { PromotionActions } from "@medusajs/framework/utils"
import {
  createWorkflow,
  parallelize,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type { OrderDTO } from "@medusajs/framework/types"
import { getActionsToComputeFromPromotionsStep } from "#cart/steps/get-actions-to-compute-from-promotions"
import { getPromotionCodesToApply } from "#cart/steps/get-promotion-codes-to-apply"
import { prepareAdjustmentsFromPromotionActionsStep } from "#cart/steps/prepare-adjustments-from-promotion-actions"
import { createDraftOrderLineItemAdjustmentsStep } from "#draft-order/steps/create-draft-order-line-item-adjustments"
import { createDraftOrderShippingMethodAdjustmentsStep } from "#draft-order/steps/create-draft-order-shipping-method-adjustments"
import { removeDraftOrderLineItemAdjustmentsStep } from "#draft-order/steps/remove-draft-order-line-item-adjustments"
import { removeDraftOrderShippingMethodAdjustmentsStep } from "#draft-order/steps/remove-draft-order-shipping-method-adjustments"
import { updateDraftOrderPromotionsStep } from "#draft-order/steps/update-draft-order-promotions"
import { acquireLockStep } from "#locking/steps/acquire-lock"
import { releaseLockStep } from "#locking/steps/release-lock"

export const refreshDraftOrderAdjustmentsWorkflowId =
  "refresh-draft-order-adjustments"

/**
 * The details of the draft order to refresh the adjustments for.
 */
export interface RefreshDraftOrderAdjustmentsWorkflowInput {
  /**
   * The draft order to refresh the adjustments for.
   */
  order: OrderDTO

  // TODO: I will reintroduce this type, once I have migrated all of the order flows to fit the expected type.
  //   Doing this in a single PR is too much work, so I'm going to do it in smaller PRs.
  //
  // order: Omit<OrderDTO, "items"> & {
  //   items?: ComputeActionItemLine[]
  //   promotions?: PromotionDTO[]
  // }

  /**
   * The promo codes to add or remove from the draft order.
   */
  promo_codes: string[]
  /**
   * The action to apply with the promo codes. You can
   * either:
   *
   * - Add the promo codes to the draft order.
   * - Remove the promo codes from the draft order.
   * - Replace the existing promo codes with the new ones.
   */
  action: PromotionActions
}

/**
 * This workflow refreshes the adjustments or promotions for a draft order. It's used by other workflows
 * like {@link addDraftOrderItemsWorkflow} to refresh the promotions whenever changes
 * are made to the draft order.
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around
 * refreshing the adjustments or promotions for a draft order.
 *
 * @example
 * const { result } = await refreshDraftOrderAdjustmentsWorkflow(container)
 * .run({
 *   input: {
 *     order: order,
 *     promo_codes: ["PROMO_CODE_1", "PROMO_CODE_2"],
 *     // imported from "@medusajs/framework/utils"
 *     action: PromotionActions.ADD,
 *   }
 * })
 *
 * @summary
 *
 * Refresh the promotions in a draft order.
 */
export const refreshDraftOrderAdjustmentsWorkflow = createWorkflow(
  refreshDraftOrderAdjustmentsWorkflowId,
  function (input: WorkflowData<RefreshDraftOrderAdjustmentsWorkflowInput>) {
    acquireLockStep({
      key: input.order.id,
      timeout: 2,
      ttl: 10,
    })

    const promotionCodesToApply = getPromotionCodesToApply({
      cart: input.order,
      promo_codes: input.promo_codes,
      action: input.action,
    })

    const actions = getActionsToComputeFromPromotionsStep({
      cart: input.order as any,
      promotionCodesToApply,
    })

    const {
      lineItemAdjustmentsToCreate,
      lineItemAdjustmentIdsToRemove,
      shippingMethodAdjustmentsToCreate,
      shippingMethodAdjustmentIdsToRemove,
    } = prepareAdjustmentsFromPromotionActionsStep({ actions })

    parallelize(
      removeDraftOrderLineItemAdjustmentsStep({
        lineItemAdjustmentIdsToRemove: lineItemAdjustmentIdsToRemove,
      }),
      removeDraftOrderShippingMethodAdjustmentsStep({
        shippingMethodAdjustmentIdsToRemove:
          shippingMethodAdjustmentIdsToRemove,
      }),
      createDraftOrderLineItemAdjustmentsStep({
        lineItemAdjustmentsToCreate: lineItemAdjustmentsToCreate,
        order_id: input.order.id,
      }),
      createDraftOrderShippingMethodAdjustmentsStep({
        shippingMethodAdjustmentsToCreate: shippingMethodAdjustmentsToCreate,
      }),
      updateDraftOrderPromotionsStep({
        id: input.order.id,
        promo_codes: input.promo_codes,
        action: input.action,
      })
    )

    releaseLockStep({
      key: input.order.id,
    })

    return new WorkflowResponse(void 0)
  }
)
