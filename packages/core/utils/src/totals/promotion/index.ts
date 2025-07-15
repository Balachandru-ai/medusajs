import { BigNumberInput } from "@medusajs/types"
import {
  ApplicationMethodAllocation,
  ApplicationMethodType,
} from "../../promotion"
import { MathBN } from "../math"

function getPromotionValueForPercentage(
  sumTaxRate,
  promotion,
  lineItemSubtotal
) {
  return MathBN.mult(
    MathBN.div(
      promotion.is_tax_inclusive
        ? MathBN.div(promotion.value, MathBN.add(1, sumTaxRate))
        : promotion.value,
      100
    ),
    lineItemSubtotal
  )
}

function getPromotionValueForFixed(
  sumTaxRate,
  promotion,
  itemSubtotal,
  lineItemSubtotal
) {
  const promotionAmount = promotion.is_tax_inclusive
    ? MathBN.div(promotion.value, MathBN.add(1, sumTaxRate))
    : promotion.value

  if (promotion.allocation === ApplicationMethodAllocation.ACROSS) {
    const promotionValueForItem = MathBN.mult(
      MathBN.div(itemSubtotal, lineItemSubtotal),
      promotionAmount
    )

    if (MathBN.lte(promotionValueForItem, itemSubtotal)) {
      return promotionValueForItem
    }

    const percentage = MathBN.div(
      MathBN.mult(itemSubtotal, 100),
      promotionValueForItem
    )

    return MathBN.mult(
      promotionValueForItem,
      MathBN.div(percentage, 100)
    ).precision(4)
  }
  return promotionAmount
}

export function getPromotionValue(
  sumTaxRate,
  promotion,
  lineItemSubtotal,
  lineItemsSubtotal
) {
  if (promotion.type === ApplicationMethodType.PERCENTAGE) {
    return getPromotionValueForPercentage(
      sumTaxRate,
      promotion,
      lineItemSubtotal
    )
  }

  return getPromotionValueForFixed(
    sumTaxRate,
    promotion,
    lineItemSubtotal,
    lineItemsSubtotal
  )
}

export function getApplicableQuantity(lineItem, maxQuantity) {
  if (maxQuantity && lineItem.quantity) {
    return MathBN.min(lineItem.quantity, maxQuantity)
  }

  return lineItem.quantity
}

function getLineItemSubtotal(lineItem) {
  return MathBN.div(lineItem.subtotal, lineItem.quantity)
}

export function calculateAdjustmentAmountFromPromotion(
  lineItem,
  promotion,
  lineItemsSubtotal: BigNumberInput = 0
) {
  /*
    For a promotion with an across allocation, we consider not only the line item total, but also the total of all other line items in the order.

    We then distribute the promotion value proportionally across the line items based on the total of each line item.

    For example, if the promotion is 100$, and the order total is 400$, and the items are:
      item1: 250$
      item2: 150$
      total: 400$
    
    The promotion value for the line items would be:
      item1: 62.5$
      item2: 37.5$
      total: 100$

    For the next 100$ promotion, we remove the applied promotions value from the line item total and redistribute the promotion value across the line items based on the updated totals.

    Example:
      item1: (250 - 62.5) = 187.5
      item2: (150 - 37.5) = 112.5
      total: 300

      The promotion value for the line items would be:
      item1: $62.5
      item2: $37.5
      total: 100$
  
  */
  const sumTax = MathBN.sum(
    ...((lineItem.tax_lines ?? []).map((taxLine) => taxLine.rate) ?? [])
  )
  const sumTaxRate = MathBN.div(sumTax, 100)

  if (promotion.allocation === ApplicationMethodAllocation.ACROSS) {
    const quantity = getApplicableQuantity(lineItem, promotion.max_quantity)
    const lineItemSubtotal = MathBN.mult(
      getLineItemSubtotal(lineItem),
      quantity
    )
    const applicableSubtotal = MathBN.sub(
      lineItemSubtotal,
      promotion.applied_value
    )

    if (MathBN.lte(applicableSubtotal, 0)) {
      return applicableSubtotal
    }

    const promotionValue = getPromotionValue(
      sumTaxRate,
      promotion,
      applicableSubtotal,
      lineItemsSubtotal
    )

    return MathBN.min(promotionValue, applicableSubtotal)
  }

  /*
    For a promotion with an EACH allocation, we calculate the promotion value on the line item as a whole.

    Example:
      item1: {
        subtotal: 200$,
        unit_price: 50$,
        quantity: 4,
      }
      
      When applying promotions, we need to consider 2 values:
        1. What is the maximum promotion value?
        2. What is the maximum promotion we can apply on the line item?
      
      After applying each promotion, we reduce the maximum promotion that you can add to the line item by the value of the promotions applied.
      
      We then apply whichever is lower.
  */

  const remainingItemSubtotal = MathBN.sub(
    lineItem.subtotal,
    promotion.applied_value
  )
  const unitPrice = MathBN.div(lineItem.subtotal, lineItem.quantity)
  const maximumPromotionTotal = MathBN.mult(
    unitPrice,
    promotion.max_quantity ?? MathBN.convert(1)
  )
  const applicableSubtotal = MathBN.min(
    remainingItemSubtotal,
    maximumPromotionTotal
  )

  if (MathBN.lte(applicableSubtotal, 0)) {
    return MathBN.convert(0)
  }

  const promotionValue = getPromotionValue(
    sumTaxRate,
    promotion,
    applicableSubtotal,
    lineItemsSubtotal
  )

  return MathBN.min(promotionValue, applicableSubtotal)
}
