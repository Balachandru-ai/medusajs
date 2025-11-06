import { PromotionActions } from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "#common/steps/use-query-graph"
import { acquireLockStep } from "#locking/steps/acquire-lock"
import { releaseLockStep } from "#locking/steps/release-lock"
import { createLineItemAdjustmentsStep } from "#cart/steps/create-line-item-adjustments"
import { createShippingMethodAdjustmentsStep } from "#cart/steps/create-shipping-method-adjustments"
import { getActionsToComputeFromPromotionsStep } from "#cart/steps/get-actions-to-compute-from-promotions"
import { getPromotionCodesToApply } from "#cart/steps/get-promotion-codes-to-apply"
import { prepareAdjustmentsFromPromotionActionsStep } from "#cart/steps/prepare-adjustments-from-promotion-actions"
import { removeLineItemAdjustmentsStep } from "#cart/steps/remove-line-item-adjustments"
import { removeShippingMethodAdjustmentsStep } from "#cart/steps/remove-shipping-method-adjustments"
import { validateCartStep } from "#cart/steps/validate-cart"
import { updateCartPromotionsStep } from "../steps/update-cart-promotions"
import { cartFieldsForRefreshSteps } from "../utils/fields"

/**
 * The details of the promotion updates on a cart.
 */
export type UpdateCartPromotionsWorkflowInput = {
  /**
   * The cart's ID.
   */
  cart_id?: string
  /**
   * The Cart reference.
   */
  cart?: any
  /**
   * The promotion codes to add to the cart, remove from the cart,
   * or replace all existing promotions in the cart.
   */
  promo_codes?: string[]
  /**
   * The action to perform with the specified promotion codes.
   */
  action?:
    | PromotionActions.ADD
    | PromotionActions.REMOVE
    | PromotionActions.REPLACE
}

export const updateCartPromotionsWorkflowId = "update-cart-promotions"
/**
 * This workflow updates a cart's promotions, applying or removing promotion codes from the cart. It also computes the adjustments
 * that need to be applied to the cart's line items and shipping methods based on the promotions applied. This workflow is used by
 * [Add Promotions Store API Route](https://docs.medusajs.com/api/store#carts_postcartsidpromotions).
 *
 * You can use this workflow within your own customizations or custom workflows, allowing you to update a cart's promotions within your custom flows.
 *
 * @example
 * const { result } = await updateCartPromotionsWorkflow(container)
 * .run({
 *   input: {
 *     cart_id: "cart_123",
 *     promo_codes: ["10OFF"],
 *     // imported from @medusajs/framework/utils
 *     action: PromotionActions.ADD,
 *   }
 * })
 *
 * @summary
 *
 * Update a cart's applied promotions to add, replace, or remove them.
 *
 * @property hooks.validate - This hook is executed before all operations. You can consume this hook to perform any custom validation. If validation fails, you can throw an error to stop the workflow execution.
 */
export const updateCartPromotionsWorkflow = createWorkflow(
  {
    name: updateCartPromotionsWorkflowId,
    idempotent: false,
  },
  (input: WorkflowData<UpdateCartPromotionsWorkflowInput>) => {
    const fetchCart = when("should-fetch-cart", { input }, ({ input }) => {
      return !input.cart
    }).then(() => {
      const { data: cart } = useQueryGraphStep({
        entity: "cart",
        fields: cartFieldsForRefreshSteps,
        filters: { id: input.cart_id },
        options: { isList: false },
      }).config({ name: "fetch-cart" })

      return cart
    })

    const cart = transform({ fetchCart, input }, ({ fetchCart, input }) => {
      return input.cart ?? fetchCart
    })

    validateCartStep({ cart })

    acquireLockStep({
      key: cart.id,
      timeout: 2,
      ttl: 10,
    })

    const validate = createHook("validate", {
      input,
      cart,
    })

    const promo_codes = transform({ input }, (data) => {
      return (data.input.promo_codes || []) as string[]
    })

    const action = transform({ input }, (data) => {
      return data.input.action || PromotionActions.ADD
    })

    const promotionCodesToApply = getPromotionCodesToApply({
      cart: cart,
      promo_codes,
      action: action as PromotionActions,
    })

    const actions = getActionsToComputeFromPromotionsStep({
      cart,
      promotionCodesToApply,
    })

    const {
      lineItemAdjustmentsToCreate,
      lineItemAdjustmentIdsToRemove,
      shippingMethodAdjustmentsToCreate,
      shippingMethodAdjustmentIdsToRemove,
      computedPromotionCodes,
    } = prepareAdjustmentsFromPromotionActionsStep({ actions })

    parallelize(
      removeLineItemAdjustmentsStep({ lineItemAdjustmentIdsToRemove }),
      removeShippingMethodAdjustmentsStep({
        shippingMethodAdjustmentIdsToRemove,
      }),
      createLineItemAdjustmentsStep({ lineItemAdjustmentsToCreate }),
      createShippingMethodAdjustmentsStep({
        shippingMethodAdjustmentsToCreate,
      }),
      updateCartPromotionsStep({
        id: cart.id,
        promo_codes: computedPromotionCodes,
        action: PromotionActions.REPLACE,
      })
    )

    releaseLockStep({
      key: cart.id,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate],
    })
  }
)
