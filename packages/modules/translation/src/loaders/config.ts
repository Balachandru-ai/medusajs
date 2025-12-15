import { LoaderOptions } from "@medusajs/framework/types"
import {
  PRODUCT_COLLECTION_TRANSLATABLE_FIELDS,
  PRODUCT_TRANSLATABLE_FIELDS,
  PRODUCT_TYPE_TRANSLATABLE_FIELDS,
  PRODUCT_VARIANT_TRANSLATABLE_FIELDS,
  translatableFieldsConfig,
} from "../utils/translatable-fields"
import { asValue } from "awilix"
import { TRANSLATABLE_FIELDS_CONFIG_KEY } from "@utils/constants"

export default async ({ container }: LoaderOptions): Promise<void> => {
  container.register(
    TRANSLATABLE_FIELDS_CONFIG_KEY,
    asValue(translatableFieldsConfig)
  )
}
