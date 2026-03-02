import {
  CartLineItemDTO,
  CreateLineItemForCartDTO,
  ICartModuleService,
  UpdateLineItemWithoutSelectorDTO,
  UpdateLineItemWithSelectorDTO,
} from "@medusajs/framework/types"
import {
  MathBN,
  Modules,
  deepEqualObj,
  isPresent,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * Input payload for `get-line-item-actions-step`.
 * - `id`: the cart ID we want to apply changes to
 * - `items`: desired line items (create new or merge/update existing ones)
 */
export interface GetLineItemActionsStepInput {
  /** The ID of the cart to create/update line items for. */
  id: string

  /** The line items to create or update in the cart. */
  items: CreateLineItemForCartDTO[]
}

/**
 * Output of `get-line-item-actions-step`.
 * The step splits requested items into:
 * - items to create (no matching existing line item found)
 * - items to update (matching existing line item found and quantity/prices should be adjusted)
 */
export interface GetLineItemActionsStepOutput {
  /** Line items that should be created as new records in the cart. */
  itemsToCreate: CreateLineItemForCartDTO[]

  /**
   * Line items that should be updated.
   * Note: depending on how the step is consumed, it may use selector-based updates
   * or direct updates without a selector.
   */
  itemsToUpdate:
    | UpdateLineItemWithSelectorDTO[]
    | UpdateLineItemWithoutSelectorDTO[]
}

/**
 * Unique identifier of the workflow step.
 * Used by the workflow engine for tracing, debugging, and step composition.
 */
export const getLineItemActionsStepId = "get-line-item-actions-step"
/**
 * This step returns lists of cart line items to create or update based on the
 * provided input.
 *
 * @example
 * const data = getLineItemActionsStep({
 *   "id": "cart_123",
 *   "items": [{
 *     "title": "Shirt",
 *     "quantity": 1,
 *     "unit_price": 50,
 *     "cart_id": "cart_123",
 *   }]
 * })
 */
export const getLineItemActionsStep = createStep(
  getLineItemActionsStepId,
  async (data: GetLineItemActionsStepInput, { container }) => {
    if (!data.items?.length) {
      return new StepResponse({ itemsToCreate: [], itemsToUpdate: [] }, null)
    }

    const cartModule = container.resolve<ICartModuleService>(Modules.CART)

    const variantIds = [...new Set(data.items.map((d) => d.variant_id!).filter(Boolean))]

    const existingVariantItems = await cartModule.listLineItems(
      {
        cart_id: data.id,
        variant_id: variantIds,
      },
      {
        select: [
          "id",
          "metadata",
          "variant_id",
          "quantity",
          "unit_price",
          "compare_at_unit_price",
        ],
      }
    )

    /**
     * CHANGE NOTE:
     * We cannot map `variant_id -> single line item`, because a cart may contain
     * multiple line items with the same `variant_id` but different `metadata`.
     * Therefore we group existing items by `variant_id` into arrays and match by deep metadata equality.
     */
    const variantItemMap = new Map<string, CartLineItemDTO[]>()
    for (const li of existingVariantItems) {
      const vid = li.variant_id
      if (!vid) continue
      const arr = variantItemMap.get(vid) ?? []
      arr.push(li)
      variantItemMap.set(vid, arr)
    }

    const itemsToCreate: CreateLineItemForCartDTO[] = []

    // Accumulate updates per existing line item ID to avoid sending multiple updates for the same item.
    const updatesById = new Map<string, UpdateLineItemWithSelectorDTO["data"]>()

    const metadataEquals = (a: unknown, b: unknown) => {
      return (!isPresent(a) && !isPresent(b)) || deepEqualObj(a as any, b as any)
    }

    for (const item of data.items) {
      const variantId = item.variant_id!
      const candidates = variantItemMap.get(variantId) ?? []

      // Find an existing line item with the same variant AND matching metadata
      const match = candidates.find((existing) =>
        metadataEquals(existing.metadata, item.metadata)
      )

      if (match) {
        const alreadyPlanned = updatesById.get(match.id)

        const baseQuantity = alreadyPlanned
          ? (alreadyPlanned.quantity as number)
          : (match.quantity as number)

        const nextQuantity = MathBN.sum(baseQuantity, item.quantity ?? 1)

        updatesById.set(match.id, {
          id: match.id,
          variant_id: variantId,
          quantity: nextQuantity,
          unit_price: item.unit_price ?? alreadyPlanned?.unit_price ?? match.unit_price,
          compare_at_unit_price:
            item.compare_at_unit_price ??
            alreadyPlanned?.compare_at_unit_price ??
            match.compare_at_unit_price,
        })
      } else {
        // No matching metadata -> create a separate line item
        itemsToCreate.push(item)
      }
    }

    return new StepResponse(
      {
        itemsToCreate,
        itemsToUpdate: Array.from(updatesById.values()),
      } as GetLineItemActionsStepOutput,
      null
    )
  }
)
