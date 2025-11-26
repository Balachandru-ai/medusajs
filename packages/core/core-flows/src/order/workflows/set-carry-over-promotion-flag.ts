import {
  IOrderModuleService,
  OrderChangeDTO,
  OrderDTO,
  PromotionDTO,
} from "@medusajs/framework/types"
import {
  ApplicationMethodAllocation,
  ChangeActionType,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowData,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common"
import { deleteOrderChangeActionsStep } from "../steps/delete-order-change-actions"
import { updateOrderChangesStep } from "../steps/update-order-changes"
import { throwIfOrderChangeIsNotActive } from "../utils/order-validation"
import { computeAdjustmentsForPreviewWorkflow } from "./order-edit/compute-adjustments-for-preview"

/**
 * The data to set the carry over promotions flag for an order change.
 */
export type SetCarryOverPromotionFlagWorkflowInput = {
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
export const validateCarryOverPromotionFlagStep = createStep(
  "validate-carry-over-promotion-flag",
  async function ({
    orderChange,
    order,
    input,
  }: {
    orderChange: OrderChangeDTO
    order: OrderDTO & { promotions?: PromotionDTO[] }
    input: SetCarryOverPromotionFlagWorkflowInput
  }) {
    // Validate order change is active
    throwIfOrderChangeIsNotActive({ orderChange })

    // Validate order change is exchange
    if (!orderChange.exchange_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order change ${orderChange.id} is not an exchange.`
      )
    }

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
          allocation !== ApplicationMethodAllocation.ACROSS ||
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

/**
 * This step lists order change actions filtered by action type.
 */
export const listOrderChangeActionsByTypeStep = createStep(
  "list-order-change-actions-by-type",
  async function (
    {
      order_change_id,
      action_type,
    }: {
      order_change_id: string
      action_type: ChangeActionType
    },
    { container }
  ) {
    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    const actions = await service.listOrderChangeActions(
      {
        order_change_id,
      },
      {
        select: ["id", "action"],
      }
    )

    const filteredActions = actions.filter(
      (action) => action.action === action_type
    )

    return new StepResponse(filteredActions.map((action) => action.id))
  }
)

export const setCarryOverPromotionFlagForOrderChangeWorkflowId =
  "set-carry-over-promotion-flag-for-order-change"

/**
 * This workflow sets the carry over promotions flag for an order change.
 * It validates that the order change is active and is an exchange, validates promotion allocation,
 * and either applies or removes promotion adjustments based on the flag value.
 *
 * @example
 * const { result } = await setCarryOverPromotionFlagForOrderChangeWorkflow(container)
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
export const setCarryOverPromotionFlagForOrderChangeWorkflow = createWorkflow(
  setCarryOverPromotionFlagForOrderChangeWorkflowId,
  function (
    input: WorkflowData<SetCarryOverPromotionFlagWorkflowInput>
  ): WorkflowResponse<OrderChangeDTO> {
    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: [
        "id",
        "status",
        "version",
        "exchange_id",
        "order_id",
        "canceled_at",
        "confirmed_at",
        "declined_at",
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

    validateCarryOverPromotionFlagStep({
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

    // Update the carry_over_promotions flag
    const updatedOrderChanges = updateOrderChangesStep([
      {
        id: input.order_change_id,
        carry_over_promotions: input.carry_over_promotions,
      },
    ])

    const updatedOrderChange = transform(
      { updatedOrderChanges },
      ({ updatedOrderChanges }) => updatedOrderChanges[0]
    )

    when(
      "should-apply-promotions",
      { flag: input.carry_over_promotions },
      ({ flag }) => flag === true
    ).then(() => {
      // Apply promotions by computing adjustments
      computeAdjustmentsForPreviewWorkflow.runAsStep({
        input: {
          order: orderWithPromotions,
          orderChange,
          exchange_id: orderChange.exchange_id!,
        },
      })
    })

    when(
      "should-remove-promotions",
      { flag: input.carry_over_promotions },
      ({ flag }) => !flag
    ).then(() => {
      // Remove promotion adjustments
      const actionIds = listOrderChangeActionsByTypeStep({
        order_change_id: input.order_change_id,
        action_type: ChangeActionType.ITEM_ADJUSTMENTS_REPLACE,
      })

      deleteOrderChangeActionsStep({ ids: actionIds })
    })

    return new WorkflowResponse(updatedOrderChange)
  }
)
