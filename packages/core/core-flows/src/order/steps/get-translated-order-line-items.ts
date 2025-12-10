import { ProductVariantDTO } from "@medusajs/framework/types"
import { applyTranslations, FeatureFlag } from "@medusajs/framework/utils"
import {
  createStep,
  StepFunction,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { applyTranslationsToItems } from "../../cart/utils/apply-translations-to-items"

export interface GetTranslatedOrderLineItemsStepInput<T> {
  items: T[] | undefined
  variants: Partial<ProductVariantDTO>[]
  locale: string | null | undefined
}

export const getTranslatedOrderLineItemsStepId =
  "get-translated-order-line-items"

const step = createStep(
  getTranslatedOrderLineItemsStepId,
  async (data: GetTranslatedOrderLineItemsStepInput<any>, { container }) => {
    const isTranslationEnabled = FeatureFlag.isFeatureEnabled("translation")

    if (!isTranslationEnabled || !data.locale || !data.items?.length) {
      return new StepResponse(data.items ?? [])
    }

    await applyTranslations({
      localeCode: data.locale,
      objects: data.variants,
      container,
    })

    const translatedItems = applyTranslationsToItems(data.items, data.variants)

    return new StepResponse(translatedItems)
  }
)

/**
 * This step translates order line items based on their associated variant and product IDs.
 * It fetches translations for the product (title, description, subtitle) and variant (title),
 * then applies them to the corresponding line item fields.
 */
export const getTranslatedOrderLineItemsStep = <T>(
  data: GetTranslatedOrderLineItemsStepInput<T>
): ReturnType<StepFunction<any, T[]>> => step(data)
