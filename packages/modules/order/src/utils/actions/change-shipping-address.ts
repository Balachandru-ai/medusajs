import { ChangeActionType } from "@medusajs/framework/utils"
import { OrderChangeProcessing } from "#utils/calculate-order-change"
import { setActionReference } from "#utils/set-action-reference"

OrderChangeProcessing.registerActionType(
  ChangeActionType.UPDATE_ORDER_PROPERTIES,
  {
    operation({ action, currentOrder, options }) {
      /**
       * NOOP: used as a reference for the change
       */

      setActionReference(currentOrder, action, options)
    },
    validate({ action }) {
      /* noop */
    },
  }
)
