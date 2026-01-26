import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/utils"
import { CUSTOM_MODULE } from "../modules/custom/service"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
  },
  {
    linkable: {
      serviceName: CUSTOM_MODULE,
      alias: "custom",
      primaryKey: "product_id",
    },
  },
  {
    readOnly: true,
  }
)
