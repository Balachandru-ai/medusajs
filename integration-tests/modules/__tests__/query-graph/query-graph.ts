import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import path from "path"

jest.setTimeout(100000)

import { Modules } from "@medusajs/utils"

const createTranslations = async (container, inputs) => {
  const translationModule: any = container.resolve("translation")

  const created = await translationModule.createTranslations(inputs as any)
  return Array.isArray(created) ? created : [created]
}

const attachTranslationToProduct = async (
  container,
  { productId, translation }
) => {
  const [created] = await createTranslations(container, [translation])

  const remoteLink: any = container.resolve("remoteLink")
  await remoteLink.create({
    [Modules.PRODUCT]: { product_id: productId },
    translation: { translation_id: created.id },
  })

  return created
}

/**
 * Ensures a translation exists (creates if missing) and links it to a product variant.
 */
const attachTranslationToVariant = async (
  container,
  { variantId, translation }
) => {
  const [created] = await createTranslations(container, [translation])

  const remoteLink: any = container.resolve("remoteLink")
  await remoteLink.create({
    [Modules.PRODUCT]: { product_variant_id: variantId },
    translation: { translation_id: created.id },
  })

  return created
}

/**
 * Ensures a translation exists (creates if missing) and links it to a product option.
 */
const attachTranslationToOption = async (
  container,
  { optionId, translation }
) => {
  const [created] = await createTranslations(container, [translation])

  const remoteLink: any = container.resolve("remoteLink")
  await remoteLink.create({
    [Modules.PRODUCT]: { product_option_id: optionId },
    translation: { translation_id: created.id },
  })

  return created
}

/**
 * Ensures a translation exists (creates if missing) and links it to a product category.
 */
const attachTranslationToProductCategory = async (
  container,
  { categoryId, translation }
) => {
  const [created] = await createTranslations(container, [translation])

  const remoteLink: any = container.resolve("remoteLink")
  await remoteLink.create({
    [Modules.PRODUCT]: { product_category_id: categoryId },
    translation: { translation_id: created.id },
  })

  return created
}

medusaIntegrationTestRunner({
  cwd: path.join(__dirname, "../__fixtures__/translation-test"),
  testSuite: ({ api, dbConnection, getContainer }) => {
    describe("query.graph()", () => {
      beforeEach(async () => {
        const productService: any = getContainer().resolve("product")

        // Create 3 categories
        const categories = await Promise.all(
          [1, 2, 3].map((i) =>
            productService.createProductCategories({
              name: `Category ${i}`,
            })
          )
        )

        // Helper to build product payloads with one option and 2 variants
        const buildProduct = (i: number, categoryId: string) => ({
          title: `Product ${i}`,
          category_ids: [categoryId],
          options: [
            {
              title: "size",
              values: ["small", "large"],
            },
          ],
          variants: [
            {
              title: `P${i} Variant 1`,
              options: { size: "small" },
            },
            {
              title: `P${i} Variant 2`,
              options: { size: "large" },
            },
          ],
        })

        // Create products
        const createdProducts = await Promise.all(
          [1, 2, 3].map((i) =>
            productService.createProducts(buildProduct(i, categories[i - 1].id))
          )
        )

        // Retrieve products with relations to get option/variant ids
        const productsWithRels = await Promise.all(
          createdProducts.map((p) =>
            productService.retrieveProduct(p.id, {
              relations: [
                "variants",
                "options",
                "options.values",
                "categories",
              ],
            })
          )
        )

        // Attach translations to product, category, variants and options
        await Promise.all(
          productsWithRels.map(async (p, idx) => {
            const i = idx + 1
            // product
            await attachTranslationToProduct(getContainer(), {
              productId: p.id,
              translation: {
                key: p.id,
                value: {
                  pt: { title: `Produto ${i}` },
                  fr: { title: `Produit ${i}` },
                },
              },
            })

            // category (assume first category)
            const cat = p.categories?.[0]
            if (cat) {
              await attachTranslationToProductCategory(getContainer(), {
                categoryId: cat.id,
                translation: {
                  key: cat.id,
                  value: {
                    pt: { name: `Categoria ${i}` },
                    fr: { name: `Catégorie ${i}` },
                  },
                },
              })
            }

            // option (assume single option on the product)
            const opt = p.options?.[0]
            if (opt) {
              await attachTranslationToOption(getContainer(), {
                optionId: opt.id,
                translation: {
                  key: opt.id,
                  value: {
                    pt: { title: "Tamanho" },
                    fr: { title: "Taille" },
                  },
                },
              })
            }

            // variants
            await Promise.all(
              (p.variants || []).map((v, vi) =>
                attachTranslationToVariant(getContainer(), {
                  variantId: v.id,
                  translation: {
                    key: v.id,
                    value: {
                      pt: { title: `Variante ${vi + 1}` },
                      fr: { title: `Variante ${vi + 1}` },
                    },
                  },
                })
              )
            )
          })
        )
      })
      it("should call all modules from query.graph in parallel", async () => {
        const container = getContainer()
        const query = container.resolve("query")

        let product

        const now = performance.now()
        for (let i = 0; i < 50; i++) {
          product = await query.graph({
            entity: "product",
            fields: [
              "title",
              "translation.*",
              "categories.name",
              "categories.translation.*",
              "variants.title",
              "variants.translation.*",
              "options.title",
              "options.translation.*",
            ],
          })
        }

        console.log(performance.now() - now, "ms")
        console.log(JSON.stringify(product, null, 2))
      })
    })
  },
})
