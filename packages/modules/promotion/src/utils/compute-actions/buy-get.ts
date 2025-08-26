import {
  BigNumberInput,
  ComputeActionItemLine,
  PromotionTypes,
} from "@medusajs/framework/types"
import {
  ApplicationMethodTargetType,
  ComputedActions,
  MathBN,
  MedusaError,
  PromotionType,
} from "@medusajs/framework/utils"
import { areRulesValidForContext } from "../validations"
import { computeActionForBudgetExceeded } from "./usage"

export type EligibleItem = {
  item_id: string
  quantity: BigNumberInput
}

function sortByPrice(a: ComputeActionItemLine, b: ComputeActionItemLine) {
  return MathBN.lt(a.subtotal, b.subtotal) ? 1 : -1
}

/*
  Grabs all the items in the context where the rules apply
  We then sort by price to prioritize most valuable item
*/
function filterItemsByPromotionRules(
  itemsContext: ComputeActionItemLine[],
  rules?: PromotionTypes.PromotionRuleDTO[]
) {
  return itemsContext
    .filter((item) =>
      areRulesValidForContext(
        rules || [],
        item,
        ApplicationMethodTargetType.ITEMS
      )
    )
    .sort(sortByPrice)
}

export function getComputedActionsForBuyGet(
  promotion: PromotionTypes.PromotionDTO,
  itemsContext: ComputeActionItemLine[],
  methodIdPromoValueMap: Map<string, BigNumberInput>,
  eligibleBuyItemMap: Map<string, EligibleItem[]>,
  eligibleTargetItemMap: Map<string, EligibleItem[]>
): PromotionTypes.ComputeActions[] {
  const computedActions: PromotionTypes.ComputeActions[] = []

  if (!itemsContext) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `"items" should be present as an array in the context to compute actions`
    )
  }

  if (!itemsContext?.length) {
    return computedActions
  }

  const minimumBuyQuantity = MathBN.convert(
    promotion.application_method?.buy_rules_min_quantity ?? 0
  )

  const itemsMap = new Map<string, ComputeActionItemLine>(
    itemsContext.map((i) => [i.id, i])
  )

  if (
    MathBN.lte(minimumBuyQuantity, 0) ||
    !promotion.application_method?.buy_rules?.length
  ) {
    return computedActions
  }

  const eligibleBuyItems = filterItemsByPromotionRules(
    itemsContext,
    promotion.application_method?.buy_rules
  )

  if (!eligibleBuyItems.length) {
    return computedActions
  }

  const eligibleBuyItemQuantity = MathBN.sum(
    ...eligibleBuyItems.map((item) => item.quantity)
  )

  /*
    Get the total quantity of items where buy rules apply. If the total sum of eligible items
    does not match up to the minimum buy quantity set on the promotion, return early.
  */
  if (MathBN.gt(minimumBuyQuantity, eligibleBuyItemQuantity)) {
    return computedActions
  }

  // Get the number of target items that should receive the discount per application
  const targetQuantityPerApplication = MathBN.convert(
    promotion.application_method?.apply_to_quantity ?? 0
  )

  // Get the maximum total quantity that can receive the discount across all applications
  // Default to 1 if not specified to maintain backwards compatibility
  const maxQuantity = MathBN.convert(
    promotion.application_method?.max_quantity ?? 1
  )

  // If no target quantity is specified, return early
  if (MathBN.lte(targetQuantityPerApplication, 0)) {
    return computedActions
  }

  // Find all items that match the target rules criteria
  const eligibleTargetItems = filterItemsByPromotionRules(
    itemsContext,
    promotion.application_method?.target_rules
  )

  // If no items match the target rules, return early
  if (!eligibleTargetItems.length) {
    return computedActions
  }

  // Calculate remaining quantities for buy items after accounting for what other promotions have consumed
  const remainingBuyQuantities = new Map<string, BigNumberInput>()
  for (const buyItem of eligibleBuyItems) {
    let consumedByOtherPromotions = MathBN.convert(0)

    // Sum up quantities consumed by other promotions (both buy and target consumption)
    for (const [code, eligibleItems] of eligibleBuyItemMap) {
      if (code === promotion.code!) continue

      for (const eligibleItem of eligibleItems) {
        if (eligibleItem.item_id === buyItem.id) {
          consumedByOtherPromotions = MathBN.add(
            consumedByOtherPromotions,
            eligibleItem.quantity
          )
        }
      }
    }

    // Also account for target items consumed by other promotions
    for (const [code, eligibleItems] of eligibleTargetItemMap) {
      if (code === promotion.code!) continue

      for (const eligibleItem of eligibleItems) {
        if (eligibleItem.item_id === buyItem.id) {
          consumedByOtherPromotions = MathBN.add(
            consumedByOtherPromotions,
            eligibleItem.quantity
          )
        }
      }
    }

    const remaining = MathBN.sub(buyItem.quantity, consumedByOtherPromotions)
    remainingBuyQuantities.set(buyItem.id, MathBN.max(remaining, 0))
  }

  // Calculate remaining quantities for target items after accounting for what other promotions have consumed
  const remainingTargetQuantities = new Map<string, BigNumberInput>()
  for (const targetItem of eligibleTargetItems) {
    let consumedByOtherPromotions = MathBN.convert(0)

    // Sum up quantities consumed by other promotions (both buy and target consumption)
    for (const [code, eligibleItems] of eligibleBuyItemMap) {
      if (code === promotion.code!) continue

      for (const eligibleItem of eligibleItems) {
        if (eligibleItem.item_id === targetItem.id) {
          consumedByOtherPromotions = MathBN.add(
            consumedByOtherPromotions,
            eligibleItem.quantity
          )
        }
      }
    }

    // Also account for target items consumed by other promotions
    for (const [code, eligibleItems] of eligibleTargetItemMap) {
      if (code === promotion.code!) continue

      for (const eligibleItem of eligibleItems) {
        if (eligibleItem.item_id === targetItem.id) {
          consumedByOtherPromotions = MathBN.add(
            consumedByOtherPromotions,
            eligibleItem.quantity
          )
        }
      }
    }

    const remaining = MathBN.sub(targetItem.quantity, consumedByOtherPromotions)
    remainingTargetQuantities.set(targetItem.id, MathBN.max(remaining, 0))
  }

  const totalEligibleItemsByPromotion: EligibleItem[] = []
  const totalTargetItemsByPromotion: EligibleItem[] = []
  const applicablePercentage = promotion.application_method?.value ?? 100

  // Track accumulated discount amounts per item for this promotion
  const itemDiscountMap = new Map<string, BigNumberInput>()
  
  // Track total quantity that has received discounts to enforce max_quantity limit
  let totalDiscountedQuantity = MathBN.convert(0)

  // Keep applying promotion until we run out of eligible buy items, target items, or hit max_quantity
  while (true) {
    // Check if we've reached the maximum quantity limit
    if (MathBN.gte(totalDiscountedQuantity, maxQuantity)) {
      break
    }

    // Check if we have enough buy quantity remaining for one more application
    const totalRemainingBuyQuantity = MathBN.sum(
      ...Array.from(remainingBuyQuantities.values())
    )

    if (MathBN.lt(totalRemainingBuyQuantity, minimumBuyQuantity)) {
      break
    }

    // Try to find enough buy items for one promotion application
    const eligibleItemsByPromotion: EligibleItem[] = []
    let accumulatedQuantity = MathBN.convert(0)

    /*
      Eligibility of a BuyGet promotion can span across line items. Once an item has been chosen
      as eligible, we can't use this item or its partial remaining quantity when we apply the promotion on
      the target item.

      We build the map here to use when we apply promotions on the target items.
    */

    for (const eligibleBuyItem of eligibleBuyItems) {
      if (MathBN.gte(accumulatedQuantity, minimumBuyQuantity)) {
        break
      }

      const availableQuantity =
        remainingBuyQuantities.get(eligibleBuyItem.id) || MathBN.convert(0)
      if (MathBN.lte(availableQuantity, 0)) {
        continue
      }

      const reservableQuantity = MathBN.min(
        availableQuantity,
        MathBN.sub(minimumBuyQuantity, accumulatedQuantity)
      )

      if (MathBN.lte(reservableQuantity, 0)) {
        continue
      }

      eligibleItemsByPromotion.push({
        item_id: eligibleBuyItem.id,
        quantity: reservableQuantity.toNumber(),
      })

      accumulatedQuantity = MathBN.add(accumulatedQuantity, reservableQuantity)
    }

    // If we couldn't accumulate enough items to meet the minimum buy quantity, return early
    if (MathBN.lt(accumulatedQuantity, minimumBuyQuantity)) {
      break
    }

    // Track quantities of items that can't be used as targets because they were used in buy rules
    const inapplicableQuantityMap = new Map<string, BigNumberInput>()

    // Build map of quantities that are ineligible as targets because they were used to satisfy buy rules
    for (const buyItem of eligibleItemsByPromotion) {
      const currentValue =
        inapplicableQuantityMap.get(buyItem.item_id) || MathBN.convert(0)
      inapplicableQuantityMap.set(
        buyItem.item_id,
        MathBN.add(currentValue, buyItem.quantity)
      )
    }

    // Track items eligible for receiving the discount and total quantity that can be discounted
    const targetItemsByPromotion: EligibleItem[] = []
    let targetableQuantity = MathBN.convert(0)

    // Find items eligible for discount, excluding quantities used in buy rules
    for (const eligibleTargetItem of eligibleTargetItems) {
      const availableTargetQuantity =
        remainingTargetQuantities.get(eligibleTargetItem.id) ||
        MathBN.convert(0)

      // Calculate how much of this item's quantity can receive the discount
      const inapplicableQuantity =
        inapplicableQuantityMap.get(eligibleTargetItem.id) || MathBN.convert(0)
      const applicableQuantity = MathBN.sub(
        availableTargetQuantity,
        inapplicableQuantity
      )

      if (MathBN.lte(applicableQuantity, 0)) {
        continue
      }

      // Calculate how many more items we need to fulfill target quantity for this application
      const remainingNeeded = MathBN.sub(targetQuantityPerApplication, targetableQuantity)
      
      // Check how many items can still receive discounts before hitting the promotion's max_quantity limit
      // This prevents the promotion from discounting more items than the configured maximum across all applications
      const remainingMaxQuantityAllowance = MathBN.sub(maxQuantity, totalDiscountedQuantity)
      
      const fulfillableQuantity = MathBN.min(
        remainingNeeded,
        applicableQuantity,
        remainingMaxQuantityAllowance
      )

      if (MathBN.lte(fulfillableQuantity, 0)) {
        continue
      }

      // Add this item to eligible targets
      targetItemsByPromotion.push({
        item_id: eligibleTargetItem.id,
        quantity: fulfillableQuantity.toNumber(),
      })

      targetableQuantity = MathBN.add(targetableQuantity, fulfillableQuantity)

      // If we've found enough items to fulfill target quantity for this application, stop looking
      if (MathBN.gte(targetableQuantity, targetQuantityPerApplication)) {
        break
      }
    }

    // If we couldn't find enough eligible target items for this application, stop
    // Note: We also stop if we can't fulfill the minimum target quantity due to max_quantity limits
    if (MathBN.lt(targetableQuantity, targetQuantityPerApplication)) {
      break
    }

    // Update remaining quantities after consuming items for this application
    // For buy items, we consume them from the buy pool
    for (const buyItem of eligibleItemsByPromotion) {
      const currentRemaining =
        remainingBuyQuantities.get(buyItem.item_id) || MathBN.convert(0)
      remainingBuyQuantities.set(
        buyItem.item_id,
        MathBN.sub(currentRemaining, buyItem.quantity)
      )
    }

    // For target items, we consume them from target pool and also from buy pool IF it's the same item
    for (const targetItem of targetItemsByPromotion) {
      // Reduce from target pool
      const currentTargetRemaining =
        remainingTargetQuantities.get(targetItem.item_id) || MathBN.convert(0)
      remainingTargetQuantities.set(
        targetItem.item_id,
        MathBN.sub(currentTargetRemaining, targetItem.quantity)
      )
      
      // Also reduce from buy pool only if the target item is also a buy item (same product)
      if (remainingBuyQuantities.has(targetItem.item_id)) {
        const currentBuyRemaining =
          remainingBuyQuantities.get(targetItem.item_id) || MathBN.convert(0)
        remainingBuyQuantities.set(
          targetItem.item_id,
          MathBN.sub(currentBuyRemaining, targetItem.quantity)
        )
      }
    }

    // Add to total tracking
    for (const buyItem of eligibleItemsByPromotion) {
      const existingBuyItem = totalEligibleItemsByPromotion.find(
        (item) => item.item_id === buyItem.item_id
      )
      if (existingBuyItem) {
        existingBuyItem.quantity = MathBN.add(
          existingBuyItem.quantity,
          buyItem.quantity
        ).toNumber()
      } else {
        totalEligibleItemsByPromotion.push({ ...buyItem })
      }
    }

    for (const targetItem of targetItemsByPromotion) {
      const existingTargetItem = totalTargetItemsByPromotion.find(
        (item) => item.item_id === targetItem.item_id
      )
      if (existingTargetItem) {
        existingTargetItem.quantity = MathBN.add(
          existingTargetItem.quantity,
          targetItem.quantity
        ).toNumber()
      } else {
        totalTargetItemsByPromotion.push({ ...targetItem })
      }
    }

    // Apply discounts to eligible target items for this application
    let remainingQtyToApply = MathBN.convert(targetQuantityPerApplication)

    for (const targetItem of targetItemsByPromotion) {
      if (MathBN.lte(remainingQtyToApply, 0)) {
        break
      }

      const item = itemsMap.get(targetItem.item_id)!
      const appliedPromoValue =
        methodIdPromoValueMap.get(item.id) ?? MathBN.convert(0)
      const multiplier = MathBN.min(targetItem.quantity, remainingQtyToApply)

      // Calculate discount amount based on item price and applicable percentage
      const pricePerUnit = MathBN.div(item.subtotal, item.quantity)
      const applicableAmount = MathBN.mult(pricePerUnit, multiplier)
      const amount = MathBN.mult(applicableAmount, applicablePercentage).div(
        100
      )

      if (MathBN.lte(amount, 0)) {
        continue
      }

      remainingQtyToApply = MathBN.sub(remainingQtyToApply, multiplier)

      // Check if applying this discount would exceed promotion budget
      const budgetExceededAction = computeActionForBudgetExceeded(
        promotion,
        amount
      )

      if (budgetExceededAction) {
        computedActions.push(budgetExceededAction)
        continue
      }

      // Track total promotional value applied to this item
      methodIdPromoValueMap.set(
        item.id,
        MathBN.add(appliedPromoValue, amount).toNumber()
      )

      // Accumulate discount amount for this item
      const currentDiscount = itemDiscountMap.get(item.id) ?? MathBN.convert(0)
      itemDiscountMap.set(item.id, MathBN.add(currentDiscount, amount))
      
      // Track the total quantity that has received discounts to enforce max_quantity
      totalDiscountedQuantity = MathBN.add(totalDiscountedQuantity, multiplier)
    }
  }

  // Create consolidated actions for each item with accumulated discount amounts
  for (const [itemId, totalAmount] of itemDiscountMap) {
    if (MathBN.gt(totalAmount, 0)) {
      computedActions.push({
        action: ComputedActions.ADD_ITEM_ADJUSTMENT,
        item_id: itemId,
        amount: totalAmount,
        code: promotion.code!,
      })
    }
  }

  // Store the total eligible items for this promotion code in the maps
  eligibleBuyItemMap.set(promotion.code!, totalEligibleItemsByPromotion)
  eligibleTargetItemMap.set(promotion.code!, totalTargetItemsByPromotion)

  return computedActions
}

export function sortByBuyGetType(a, b) {
  if (a.type === PromotionType.BUYGET && b.type !== PromotionType.BUYGET) {
    return -1 // BuyGet promotions come first
  } else if (
    a.type !== PromotionType.BUYGET &&
    b.type === PromotionType.BUYGET
  ) {
    return 1 // BuyGet promotions come first
  } else if (a.type === b.type) {
    // If types are equal, sort by application_method.value in descending order when types are equal
    if (a.application_method.value < b.application_method.value) {
      return 1 // Higher value comes first
    } else if (a.application_method.value > b.application_method.value) {
      return -1 // Lower value comes later
    }

    /*
      If the promotion is a BuyGet & the value is the same, we need to sort by the following criteria:
      - buy_rules_min_quantity in descending order
      - apply_to_quantity in descending order
    */
    if (a.type === PromotionType.BUYGET) {
      if (
        a.application_method.buy_rules_min_quantity <
        b.application_method.buy_rules_min_quantity
      ) {
        return 1
      } else if (
        a.application_method.buy_rules_min_quantity >
        b.application_method.buy_rules_min_quantity
      ) {
        return -1
      }

      if (
        a.application_method.apply_to_quantity <
        b.application_method.apply_to_quantity
      ) {
        return 1
      } else if (
        a.application_method.apply_to_quantity >
        b.application_method.apply_to_quantity
      ) {
        return -1
      }
    }

    return 0 // If all criteria are equal, keep original order
  } else {
    return 0 // If types are different (and not BuyGet), keep original order
  }
}
