import { ProductVariantDTO } from "@medusajs/framework/types"
import { applyTranslations, FeatureFlag } from "@medusajs/framework/utils"
import {
  createStep,
  StepFunction,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

export interface GetTranslatedLineItemsStepInput<T> {
  items: T[] | undefined
  variants: Partial<ProductVariantDTO>[]
  localeCode: string | undefined
}

const productFields = [
  "title",
  "description",
  "subtitle",
  "type.value",
  "collection.title",
  "handle",
] as const
const variantFields = ["title"] as const

export const getTranslatedLineItemsStepId = "get-translated-line-items"

const step = createStep(
  getTranslatedLineItemsStepId,
  async (data: GetTranslatedLineItemsStepInput<any>, { container }) => {
    const isTranslationEnabled = FeatureFlag.isFeatureEnabled("translation")

    if (!isTranslationEnabled || !data.localeCode || !data.items?.length) {
      return new StepResponse(data.items ?? [])
    }

    await applyTranslations({
      localeCode: data.localeCode,
      objects: data.variants,
      container,
    })

    const variantMap = new Map(
      data.variants.map((variant) => [variant.id, variant])
    )

    const translatedItems = data.items.map((item) => {
      if (item.variant_id) {
        const variant = variantMap.get(item.variant_id)
        if (variant) {
          variantFields.forEach((field) => {
            const itemKey = `variant_${field}`
            if (
              itemKey in item &&
              typeof item[itemKey] === typeof variant[field]
            ) {
              item[itemKey] = variant[field]
            }
          })

          if (variant.product) {
            productFields.forEach((field) => {
              switch (field) {
                case "collection.title":
                  if (variant.product?.collection?.title) {
                    item.product_collection = variant.product?.collection?.title
                  }
                  break
                case "type.value":
                  if (variant.product?.type?.value) {
                    item.product_type = variant.product?.type?.value
                  }
                  break
                default:
                  const itemKey = `product_${field}`
                  if (
                    itemKey in item &&
                    typeof item[itemKey] === typeof variant.product![field]
                  ) {
                    item[itemKey] = variant.product![field]
                  }
              }
            })
          }
        }
      }

      return item
    })

    return new StepResponse(translatedItems)
  }
)

/**
 * This step translates cart line items based on their associated variant and product IDs.
 * It fetches translations for the product (title, description, subtitle) and variant (title),
 * then applies them to the corresponding line item fields.
 */
export const getTranslatedLineItemsStep = <T>(
  data: GetTranslatedLineItemsStepInput<T>
): ReturnType<StepFunction<any, T[]>> => step(data)
