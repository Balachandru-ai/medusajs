import { LoaderOptions } from "@medusajs/framework/types"
import {
  PRODUCT_TRANSLATABLE_FIELDS,
  PRODUCT_VARIANT_TRANSLATABLE_FIELDS,
} from "../utils/translatable-fields"
import { asValue } from "awilix"
import { TRANSLATABLE_FIELDS_CONFIG_KEY } from "@utils/constants"

export default async ({
  container,
  options,
}: LoaderOptions<{
  expandedTranslatableFields: { [key: string]: string[] }
}>): Promise<void> => {
  const { expandedTranslatableFields } = options ?? {}

  const { product, productVariant, ...others } =
    expandedTranslatableFields ?? {}

  const translatableFieldsConfig: Record<string, string[]> = {
    product: PRODUCT_TRANSLATABLE_FIELDS,
    product_variant: PRODUCT_VARIANT_TRANSLATABLE_FIELDS,
  }

  if (product) {
    const translatableFields = new Set([
      ...PRODUCT_TRANSLATABLE_FIELDS,
      ...product,
    ])
    translatableFieldsConfig.product = Array.from(translatableFields)
  }

  if (productVariant) {
    const translatableFields = new Set([
      ...PRODUCT_VARIANT_TRANSLATABLE_FIELDS,
      ...productVariant,
    ])
    translatableFieldsConfig.product_variant = Array.from(translatableFields)
  }

  if (others) {
    Object.entries(others).forEach(([key, value]) => {
      const translatableFields = new Set([...value])
      translatableFieldsConfig[key] = Array.from(translatableFields)
    })
  }

  container.register(
    TRANSLATABLE_FIELDS_CONFIG_KEY,
    asValue(translatableFieldsConfig)
  )
}
