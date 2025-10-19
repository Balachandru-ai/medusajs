import {
  BigNumber,
  ChangeActionType,
  getLineItemTotals,
  MathBN,
  MedusaError,
} from "@medusajs/framework/utils"
import { OrderChangeProcessing } from "../calculate-order-change"
import { setActionReference } from "../set-action-reference"

OrderChangeProcessing.registerActionType(ChangeActionType.ITEM_UPDATE, {
  operation({ action, currentOrder, options }) {
    const existingIndex = currentOrder.items.findIndex(
      (item) => item.id === action.details.reference_id
    )

    const existing = currentOrder.items[existingIndex]

    const originalQuantity = MathBN.convert(
      existing.detail.quantity ?? existing.quantity
    )
    const originalUnitPrice = MathBN.convert(
      existing.detail.unit_price ?? existing.unit_price
    )

    const currentQuantity = MathBN.convert(action.details.quantity)
    const quantityDiff = MathBN.sub(currentQuantity, originalQuantity)

    existing.quantity = currentQuantity
    existing.detail.quantity = currentQuantity
    
    if (action.details.adjustments) {
      existing.adjustments = action.details.adjustments
    }

    // @ts-ignore
    const itemTotals = getLineItemTotals(
      {
        id: existing.id,
        unit_price: new BigNumber(existing.unit_price),
        quantity: new BigNumber(currentQuantity),
        // @ts-ignore
        is_tax_inclusive: existing.is_tax_inclusive,
        // @ts-ignore
        tax_lines: existing.tax_lines,
        adjustments: existing.adjustments,
        // @ts-ignore
        detail: existing.detail,
      },
      {}
    )

    const unitTotal = MathBN.div(itemTotals.total, itemTotals.quantity)

    if (action.details.unit_price) {
      const currentUnitPrice = MathBN.convert(action.details.unit_price)
      const originalTotal = MathBN.mult(originalUnitPrice, originalQuantity)
      const currentTotal = MathBN.mult(currentUnitPrice, currentQuantity)

      existing.unit_price = currentUnitPrice
      existing.detail.unit_price = currentUnitPrice

      setActionReference(existing, action, options)

      return MathBN.sub(currentTotal, originalTotal)
    }

    setActionReference(existing, action, options)

    // @ts-ignore
    return MathBN.mult(unitTotal, quantityDiff)
  },
  validate({ action, currentOrder }) {
    const refId = action.details?.reference_id
    if (refId == null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reference ID is required."
      )
    }

    const existing = currentOrder.items.find((item) => item.id === refId)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Item ID "${refId}" not found.`
      )
    }

    if (action.details?.quantity == null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Quantity of item ${refId} is required.`
      )
    }

    action.details.quantity ??= 0

    const lower = MathBN.lt(
      action.details.quantity,
      existing.detail?.fulfilled_quantity
    )

    if (lower) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Item ${refId} has already been fulfilled and quantity cannot be lower than ${existing.detail?.fulfilled_quantity}.`
      )
    }
  },
})
