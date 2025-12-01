import {
  OrderChangeDTO,
  OrderDTO,
  PromotionDTO,
} from "@medusajs/framework/types"
import {
  ApplicationMethodAllocation,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common"
import { throwIfOrderChangeIsNotActive } from "../utils/order-validation"

import { computeAdjustmentsForPreviewWorkflow } from "./compute-adjustments-for-preview"

/**
 * The data to set the carry over promotions flag for an order change.
 */
export type OnCarryPromotionsFlagSetWorkflowInput = {
  /**
   * The order change's ID.
   */
  order_change_id: string
  /**
   * Whether to carry over promotions to outbound exchange items.
   */
  carry_over_promotions: boolean
}

/**
 * This step validates that the order change is an exchange and validates promotion allocation.
 */
export const validateCarryPromotionsFlagStep = createStep(
  "validate-carry-promotions-flag",
  async function ({
    orderChange,
    order,
    input,
  }: {
    orderChange: OrderChangeDTO
    order: OrderDTO & { promotions?: PromotionDTO[] }
    input: OnCarryPromotionsFlagSetWorkflowInput
  }) {
    // Validate order change is active
    throwIfOrderChangeIsNotActive({ orderChange })

    // we don't need to validate promotion since we will be resetting the adjustments
    if (!input.carry_over_promotions) {
      return
    }

    // Validate promotion allocation if promotions exist
    if (order.promotions && order.promotions.length > 0) {
      const invalidPromotions: string[] = []

      for (const promotion of order.promotions) {
        const applicationMethod = (promotion as any).application_method

        if (!applicationMethod) {
          continue
        }

        const allocation = applicationMethod.allocation
        const type = applicationMethod.type

        if (
          allocation !== ApplicationMethodAllocation.ACROSS &&
          allocation !== ApplicationMethodAllocation.EACH
        ) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Promotion ${
              promotion.code || promotion.id
            } has invalid allocation. Only promotions with EACH or ACROSS allocation can be carried over to outbound exchange items.`
          )
        }

        // For fixed promotions, allocation must be EACH
        if (
          type === "fixed" &&
          allocation !== ApplicationMethodAllocation.EACH
        ) {
          invalidPromotions.push(promotion.code || promotion.id)
        }

        // For percentage promotions, allocation must be EACH or ACROSS
        if (
          type === "percentage" &&
          allocation !== ApplicationMethodAllocation.EACH &&
          allocation !== ApplicationMethodAllocation.ACROSS
        ) {
          invalidPromotions.push(promotion.code || promotion.id)
        }
      }

      if (invalidPromotions.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Promotions with codes ${invalidPromotions.join(
            ", "
          )} have invalid allocation. Fixed promotions must have EACH allocation, and percentage promotions must have EACH or ACROSS allocation.`
        )
      }
    }
  }
)

export const onCarryPromotionsFlagSetId = "on-carry-promotions-flag-set"

/**
 * This workflow sets the carry over promotions flag for an order change.
 * It validates that the order change is active and is an exchange, validates promotion allocation,
 * and either applies or removes promotion adjustments based on the flag value.
 *
 * @example
 * const { result } = await onCarryPromotionsFlagSet(container)
 * .run({
 *   input: {
 *     order_change_id: "orch_123",
 *     carry_over_promotions: true,
 *   }
 * })
 *
 * @summary
 *
 * Set the carry over promotions flag for an order change.
 */
export const onCarryPromotionsFlagSet = createWorkflow(
  onCarryPromotionsFlagSetId,
  function (
    input: WorkflowData<OnCarryPromotionsFlagSetWorkflowInput>
  ): WorkflowResponse<void> {
    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: [
        "id",
        "status",
        "version",
        "exchange_id",
        "claim_id",
        "return_id",
        "order_id",
        "canceled_at",
        "confirmed_at",
        "declined_at",
        "carry_over_promotions",
      ],
      variables: {
        filters: {
          id: input.order_change_id,
        },
      },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "order-change-query" })

    const order: OrderDTO & { promotions?: PromotionDTO[] } =
      useRemoteQueryStep({
        entry_point: "orders",
        fields: [
          "id",
          "currency_code",
          "promotions.*",
          "promotions.application_method.*",
        ],
        variables: {
          id: orderChange.order_id,
        },
        list: false,
        throw_if_key_not_found: true,
      }).config({ name: "order-query" })

    validateCarryPromotionsFlagStep({
      orderChange,
      order,
      input,
    })

    const orderWithPromotions = transform({ order }, ({ order }) => {
      return {
        ...order,
        promotions: (order as any).promotions ?? [],
      } as OrderDTO & { promotions: PromotionDTO[] }
    })

    computeAdjustmentsForPreviewWorkflow.runAsStep({
      input: {
        orderChange,
        order: orderWithPromotions,
      },
    })

    return new WorkflowResponse(void 0)
  }
)
