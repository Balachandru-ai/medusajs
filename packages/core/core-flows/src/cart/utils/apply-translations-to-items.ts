import { ProductVariantDTO } from "@medusajs/framework/types"

const productFields = [
  "title",
  "description",
  "subtitle",
  "type.value",
  "collection.title",
  "handle",
] as const

const variantFields = ["title"] as const

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
    variantFields.forEach((field) => {
      const itemKey = `variant_${field}`
      if (
        itemKey in itemAny &&
        typeof itemAny[itemKey] === typeof variant[field]
      ) {
        itemAny[itemKey] = variant[field]
      }
    })

    // Apply product translations
    if (variant.product) {
      productFields.forEach((field) => {
        switch (field) {
          case "collection.title":
            if (variant.product?.collection?.title) {
              itemAny.product_collection = variant.product.collection.title
            }
            break
          case "type.value":
            if (variant.product?.type?.value) {
              itemAny.product_type = variant.product.type.value
            }
            break
          default:
            const itemKey = `product_${field}`
            if (
              itemKey in itemAny &&
              typeof itemAny[itemKey] === typeof (variant.product as any)[field]
            ) {
              itemAny[itemKey] = (variant.product as any)[field]
            }
        }
      })
    }

    return item
  })
}
