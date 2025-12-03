import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, MedusaContainer } from "@medusajs/framework/types"
import {
  isObject,
  isPresent,
  MedusaError,
  QueryContext,
} from "@medusajs/framework/utils"
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

  const gatheredIds: Set<string> = new Set()
  function gatherIds(object: Record<string, any>) {
    gatheredIds.add(object.id)
    Object.entries(object).forEach(([, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => gatherIds(item))
      } else if (isObject(value)) {
        gatherIds(value)
      }
    })
  }

  for (const product of products) {
    gatherIds(product)
  }

  const query = container.resolve("query")
  const { data: translations } = await query.graph({
    entity: "translations",
    fields: ["translations", "entity_id"],
    filters: {
      entity_id: Array.from(gatheredIds),
      locale_code: locale,
    },
    pagination: {
      take: gatheredIds.size,
    },
  })

  const entityIdToTranslation = new Map<string, Record<string, any>>()
  for (const translation of translations) {
    entityIdToTranslation.set(
      translation.entity_id,
      translation.translations ?? {}
    )
  }

  function applyTranslation(object: Record<string, any>) {
    const translation = entityIdToTranslation.get(object.id)
    if (translation) {
      Object.keys(translation).forEach((key) => {
        if (key in object) {
          if (Array.isArray(object[key])) {
            for (const item of object[key]) {
              applyTranslation(item)
            }
          } else if (isObject(object[key])) {
            applyTranslation(object[key])
          } else {
            object[key] = translation[key]
          }
        }
      })
    }
  }

  for (const product of products) {
    applyTranslation(product)
  }
}
