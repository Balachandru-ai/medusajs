import { ChangeActionType, MedusaError } from "@medusajs/framework/utils"
import { OrderChangeProcessing } from "#utils/calculate-order-change"
import { setActionReference } from "#utils/set-action-reference"

OrderChangeProcessing.registerActionType(ChangeActionType.TRANSFER_CUSTOMER, {
  operation({ action, currentOrder, options }) {
    currentOrder.customer_id = action.reference_id

    setActionReference(currentOrder, action, options)
  },
  validate({ action }) {
    if (!action.reference_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reference to customer ID is required"
      )
    }
  },
})
