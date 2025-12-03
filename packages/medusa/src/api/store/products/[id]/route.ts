import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, MedusaContainer } from "@medusajs/framework/types"
import { isPresent, MedusaError, QueryContext } from "@medusajs/framework/utils"
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "../../../utils/middlewares"
import {
  filterOutInternalProductCategories,
  refetchProduct,
  RequestWithContext,
  wrapProductsWithTaxPrices,
} from "../helpers"

export const GET = async (
  req: RequestWithContext<HttpTypes.StoreProductParams>,
  res: MedusaResponse<HttpTypes.StoreProductResponse>
) => {
  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes("variants.inventory_quantity")
  )

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.inventory_quantity")
    )
  }

  const filters: object = {
    id: req.params.id,
    ...req.filterableFields,
  }

  if (isPresent(req.pricingContext)) {
    filters["context"] ??= {}
    filters["context"]["variants"] ??= {}
    filters["context"]["variants"]["calculated_price"] ??= QueryContext(
      req.pricingContext!
    )
  }

  const includesCategoriesField = req.queryConfig.fields.some((field) =>
    field.startsWith("categories")
  )

  if (!req.queryConfig.fields.includes("categories.is_internal")) {
    req.queryConfig.fields.push("categories.is_internal")
  }

  const product = await refetchProduct(
    filters,
    req.scope,
    req.queryConfig.fields
  )

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${req.params.id} was not found`
    )
  }

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      product.variants || []
    )
  }

  if (includesCategoriesField) {
    filterOutInternalProductCategories([product])
  }

  await wrapProductsWithTaxPrices(req, [product])
  await applyTranslations({ req, products: [product], container: req.scope })
  res.json({ product })
}

async function applyTranslations({
  req,
  products,
  container,
}: {
  req: MedusaRequest
  products: HttpTypes.StoreProduct[]
  container: MedusaContainer
}) {
  const locale = req.locale ?? "en-US"
  const productIds = new Set(products.map((product) => product.id))

  const query = container.resolve("query")
  const translations = await query.graph({
    entity: "translations",
    fields: ["translations", "entity_id"],
    filters: {
      id: Array.from(productIds),
      entity_type: "product",
      locale_code: locale,
    },
  })

  const entityIdToTranslation = new Map()
  for (const translation of translations.data) {
    entityIdToTranslation.set(translation.entity_id, translation.translation)
  }

  function applyTranslation(product: HttpTypes.StoreProduct) {
    const translation = entityIdToTranslation.get(product.id)
    if (translation) {
      Object.keys(translation).forEach((key) => {
        if (key in product) {
          product[key] = translation[key]
        }
      })
    }
  }

  for (const product of products) {
    applyTranslation(product)
  }
}
