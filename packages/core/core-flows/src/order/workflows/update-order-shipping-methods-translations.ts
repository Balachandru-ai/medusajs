import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { getTranslatedShippingOptionsStep } from "../../common/steps/get-translated-shipping-option"
import { updateOrderShippingMethodsStep } from "../steps"
import { ShippingOptionDTO } from "@medusajs/types"

export const updateOrderShippingMethodsTranslationsWorkflowId =
  "update-order-shipping-methods-translations"

type UpdateOrderShippingMethodsTranslationsWorkflowInput = {
  order_id: string
  locale: string
}

export const updateOrderShippingMethodsTranslationsWorkflow = createWorkflow(
  updateOrderShippingMethodsTranslationsWorkflowId,
  (data: UpdateOrderShippingMethodsTranslationsWorkflowInput) => {
    const { data: order } = useQueryGraphStep({
      entity: "order",
      fields: [
        "shipping_methods.id",
        "shipping_methods.name",
        "shipping_methods.shipping_option_id",
      ],
      filters: {
        id: data.order_id,
      },
      options: {
        isList: false,
      },
    })

    const translateShippingOptionsInput = transform({ order }, ({ order }) => {
      return order.shipping_methods.map((sm) => ({
        id: sm.shipping_option_id,
        shipping_method_id: sm.id,
        name: sm.name,
      }))
    })

    const translatedShippingMethods = getTranslatedShippingOptionsStep({
      shippingOptions: translateShippingOptionsInput,
      locale: data.locale,
    }) as unknown as (ShippingOptionDTO & { shipping_method_id: string })[]

    const updateShippingMethodsInput = transform(
      { translatedShippingMethods },
      ({ translatedShippingMethods }) => {
        return translatedShippingMethods.map((sm) => ({
          id: sm.shipping_method_id,
          name: sm.name,
        }))
      }
    )

    return new WorkflowResponse(
      updateOrderShippingMethodsStep(updateShippingMethodsInput)
    )
  }
)
