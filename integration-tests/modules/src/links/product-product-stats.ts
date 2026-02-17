import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/utils"
import ProductStatsModule from "../modules/product-stats"

const link =
  process.env.ENABLE_INDEX_MODULE === "true"
    ? defineLink(
        ProductModule.linkable.product,
        {
          linkable: ProductStatsModule.linkable.productStats,
          filterable: ["sale_count"],
        }
      )
    : {}

export default link
