import { ProductVariantDTO } from "@medusajs/framework/types"

const VARIANT_PREFIX = "variant_"
const PRODUCT_PREFIX = "product_"
const TRANSLATABLE_ITEM_PROP_PREFIXES = [VARIANT_PREFIX, PRODUCT_PREFIX]

/**
 * Applies translated variant/product fields to line items.
 */
export function applyTranslationsToItems<
  T extends { variant_id?: string; [key: string]: any }
>(items: T[], variants: Partial<ProductVariantDTO>[]): T[] {
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]))

  return items.map((item) => {
    if (!item.variant_id) {
      return item
    }

    const variant = variantMap.get(item.variant_id)
    if (!variant) {
      return item
    }

    const itemAny = item as Record<string, any>

    // Apply variant translations
    Object.entries(items).forEach(([key, value]) => {
      const translationKey = key
        .replace(VARIANT_PREFIX, "")
        .replace(PRODUCT_PREFIX, "")

      if (
        TRANSLATABLE_ITEM_PROP_PREFIXES.some((prefix) => key.startsWith(prefix))
      ) {
        if (key in itemAny) {
          if (
            key.startsWith(VARIANT_PREFIX) &&
            typeof itemAny[key] === typeof variant[translationKey]
          ) {
            itemAny[key] = variant[translationKey]
          } else if (
            key.startsWith(PRODUCT_PREFIX) &&
            typeof itemAny[key] === typeof variant.product?.[translationKey]
          ) {
            itemAny[key] = variant.product?.[translationKey]
          }
        }
      }
    })

    return item
  })
}
