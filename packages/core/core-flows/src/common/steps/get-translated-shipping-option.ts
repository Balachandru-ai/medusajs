import { applyTranslations } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ShippingOptionDTO } from "@medusajs/types"

export const getTranslatedShippingOptionsStepId =
  "get-translated-shipping-options"

export interface GetTranslatedShippingOptionsStepInput {
  shippingOptions: ShippingOptionDTO[]
  locale: string
}

export const getTranslatedShippingOptionsStep = createStep(
  getTranslatedShippingOptionsStepId,
  async (data: GetTranslatedShippingOptionsStepInput, { container }) => {
    await applyTranslations({
      localeCode: data.locale,
      objects: data.shippingOptions,
      container,
    })

    return new StepResponse(data.shippingOptions)
  }
)
