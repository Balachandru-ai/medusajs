import {
  applyTranslations,
  ContainerRegistrationKeys,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { OrderShippingMethodDTO } from "@medusajs/types"

export const updateOrderShippingMethodsTranslationsStepId =
  "update-order-shipping-methods-translations"

export interface UpdateOrderShippingMethodsTranslationsStepInput {
  shippingMethods: OrderShippingMethodDTO[]
  locale: string
}

export const updateOrderShippingMethodsTranslationsStep = createStep(
  updateOrderShippingMethodsTranslationsStepId,
  async (
    data: UpdateOrderShippingMethodsTranslationsStepInput,
    { container }
  ) => {
    const isTranslationEnabled = FeatureFlag.isFeatureEnabled("translation")

    if (!isTranslationEnabled || !data.locale || !data.shippingMethods.length) {
      return new StepResponse(data.shippingMethods)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const orderModuleService = container.resolve(Modules.ORDER)

    const { data: translatedShippingOptions } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "name"],
      filters: {
        id: data.shippingMethods.map((sm) => sm.shipping_option_id),
      },
    })

    await applyTranslations({
      localeCode: data.locale,
      objects: translatedShippingOptions,
      container,
    })

    const shippingOptionTranslationMap = new Map<string, string>(
      translatedShippingOptions.map((tos) => [tos.id, tos.name])
    )
    const updatedShippingMethods =
      await orderModuleService.updateOrderShippingMethods(
        data.shippingMethods.map((sm) => ({
          ...sm,
          name: sm.shipping_option_id
            ? shippingOptionTranslationMap.get(sm.shipping_option_id)
            : sm.name,
        }))
      )

    return new StepResponse(updatedShippingMethods, data.shippingMethods)
  },
  async (dataBeforeUpdate, { container }) => {
    if (!dataBeforeUpdate?.length) {
      return
    }

    const orderModuleService = container.resolve(Modules.ORDER)

    await orderModuleService.updateOrderShippingMethods(dataBeforeUpdate)
  }
)
