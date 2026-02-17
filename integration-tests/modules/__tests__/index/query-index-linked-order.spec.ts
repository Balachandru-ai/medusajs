import { createProductsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { RemoteQueryFunction } from "@medusajs/types"
import { ContainerRegistrationKeys, Modules, promiseAll } from "@medusajs/utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { fetchAndRetry } from "../../../helpers/retry"
import { waitForIndexedEntities } from "../../../helpers/wait-for-index"

jest.setTimeout(300000)

process.env.ENABLE_INDEX_MODULE = "true"

/**
 * Custom workflow that composes createProductsWorkflow.runAsStep(),
 * simulating the user's createListingWorkflow pattern.
 */
const createListingWorkflow = createWorkflow(
  "create-listing-test",
  function (input: { title: string; description: string; price: number }) {
    const productInput = transform({ input }, ({ input }) => {
      const kebabTitle = input.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
      const randomHex = Math.random().toString(16).substring(2, 10)
      const handle = `${kebabTitle}-${randomHex}`

      return {
        products: [
          {
            title: input.title,
            handle,
            description: input.description,
            status: "draft" as const,
            options: [
              {
                title: "Default",
                values: ["Default"],
              },
            ],
            variants: [
              {
                title: "Default",
                options: { Default: "Default" },
                prices: [
                  {
                    amount: input.price,
                    currency_code: "usd",
                  },
                ],
                manage_inventory: false,
              },
            ],
          },
        ],
      }
    })

    const products = createProductsWorkflow.runAsStep({
      input: productInput,
    })

    return new WorkflowResponse(products)
  }
)

async function populateDataViaWorkflow(
  container: any,
  items: { title: string; description: string; price: number }[]
) {
  const products: any[] = []
  for (const item of items) {
    const { result } = await createListingWorkflow(container).run({
      input: item,
    })
    products.push(result[0])
  }
  return products
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection, api }) => {
    let appContainer

    describe("Index engine - Query.index ordering by linked entity field", () => {
      beforeAll(() => {
        appContainer = getContainer()
      })

      afterAll(() => {
        process.env.ENABLE_INDEX_MODULE = "false"
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("should order products by product_stats.sale_count DESC via query.index", async () => {
        const products = await populateDataViaWorkflow(appContainer, [
          { title: "Low Sales Product", description: "low sales", price: 1000 },
          {
            title: "High Sales Product",
            description: "high sales",
            price: 2000,
          },
          {
            title: "Medium Sales Product",
            description: "medium sales",
            price: 1500,
          },
        ])

        // Create product stats with different sale_count values
        const productStatsModule = appContainer.resolve("productStats")
        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)

        const lowProduct = products.find((p) => p.title === "Low Sales Product")
        const highProduct = products.find(
          (p) => p.title === "High Sales Product"
        )
        const medProduct = products.find(
          (p) => p.title === "Medium Sales Product"
        )

        // Create stats entries with varying sale_count
        const lowStats = await productStatsModule.createProductStats({
          product_id: lowProduct.id,
          sale_count: 5,
        })
        const highStats = await productStatsModule.createProductStats({
          product_id: highProduct.id,
          sale_count: 100,
        })
        const medStats = await productStatsModule.createProductStats({
          product_id: medProduct.id,
          sale_count: 50,
        })

        // Create links between products and their stats
        await link.create({
          [Modules.PRODUCT]: { product_id: lowProduct.id },
          productStats: { product_stats_id: lowStats.id },
        })
        await link.create({
          [Modules.PRODUCT]: { product_id: highProduct.id },
          productStats: { product_stats_id: highStats.id },
        })
        await link.create({
          [Modules.PRODUCT]: { product_id: medProduct.id },
          productStats: { product_stats_id: medStats.id },
        })

        const query = appContainer.resolve(
          ContainerRegistrationKeys.QUERY
        ) as RemoteQueryFunction

        // Wait for products and stats to be indexed
        await promiseAll([
          waitForIndexedEntities(
            dbConnection,
            "Product",
            products.map((p) => p.id)
          ),
          waitForIndexedEntities(dbConnection, "ProductStats", [
            lowStats.id,
            highStats.id,
            medStats.id,
          ]),
        ])

        // Test ordering by product_stats.sale_count DESC
        // Use fetchAndRetry with enough retries to allow link entities to be indexed
        const resultset = await fetchAndRetry(
          async () =>
            await query.index({
              entity: "product",
              fields: [
                "id",
                "title",
                "product_stats.sale_count",
                "product_stats.id",
              ],
              pagination: {
                order: {
                  product_stats: {
                    sale_count: "DESC",
                  },
                },
              },
            }),
          ({ data }) =>
            data.length === 3 &&
            data[0].title === "High Sales Product" &&
            data[1].title === "Medium Sales Product" &&
            data[2].title === "Low Sales Product",
          { retries: 10, waitSeconds: 2 }
        )

        expect(resultset.data.length).toEqual(3)

        // Verify DESC order: High (100) -> Medium (50) -> Low (5)
        expect(resultset.data[0].title).toEqual("High Sales Product")
        expect(resultset.data[1].title).toEqual("Medium Sales Product")
        expect(resultset.data[2].title).toEqual("Low Sales Product")

        // Test ordering by product_stats.sale_count ASC
        const resultsetAsc = await fetchAndRetry(
          async () =>
            await query.index({
              entity: "product",
              fields: [
                "id",
                "title",
                "product_stats.sale_count",
                "product_stats.id",
              ],
              pagination: {
                order: {
                  product_stats: {
                    sale_count: "ASC",
                  },
                },
              },
            }),
          ({ data }) =>
            data.length === 3 &&
            data[0].title === "Low Sales Product" &&
            data[1].title === "Medium Sales Product" &&
            data[2].title === "High Sales Product",
          { retries: 10, waitSeconds: 2 }
        )

        expect(resultsetAsc.data.length).toEqual(3)

        // Verify ASC order: Low (5) -> Medium (50) -> High (100)
        expect(resultsetAsc.data[0].title).toEqual("Low Sales Product")
        expect(resultsetAsc.data[1].title).toEqual("Medium Sales Product")
        expect(resultsetAsc.data[2].title).toEqual("High Sales Product")

        // Update the "Low Sales Product" stats to have the highest sale_count
        await productStatsModule.updateProductStats({
          id: lowStats.id,
          sale_count: 200,
        })

        // After update, expected DESC order: Low (200) -> High (100) -> Medium (50)
        const resultsetAfterUpdate = await fetchAndRetry(
          async () =>
            await query.index({
              entity: "product",
              fields: [
                "id",
                "title",
                "product_stats.sale_count",
                "product_stats.id",
              ],
              pagination: {
                order: {
                  product_stats: {
                    sale_count: "DESC",
                  },
                },
              },
            }),
          ({ data }) =>
            data.length === 3 &&
            data[0].title === "Low Sales Product" &&
            data[1].title === "High Sales Product" &&
            data[2].title === "Medium Sales Product",
          { retries: 10, waitSeconds: 2 }
        )

        expect(resultsetAfterUpdate.data.length).toEqual(3)
        expect(resultsetAfterUpdate.data[0].title).toEqual("Low Sales Product")
        expect(resultsetAfterUpdate.data[0].product_stats.sale_count).toEqual(
          200
        )
        expect(resultsetAfterUpdate.data[1].title).toEqual("High Sales Product")
        expect(resultsetAfterUpdate.data[1].product_stats.sale_count).toEqual(
          100
        )
        expect(resultsetAfterUpdate.data[2].title).toEqual(
          "Medium Sales Product"
        )
        expect(resultsetAfterUpdate.data[2].product_stats.sale_count).toEqual(
          50
        )
      })

      it("should index products created via a custom workflow composing createProductsWorkflow.runAsStep", async () => {
        // Create a product using the custom workflow (same pattern as user's createListingWorkflow)
        const [product] = await populateDataViaWorkflow(appContainer, [
          {
            title: "Workflow Created Product",
            description: "created via composed workflow",
            price: 2500,
          },
        ])

        const query = appContainer.resolve(
          ContainerRegistrationKeys.QUERY
        ) as RemoteQueryFunction

        // Wait for the product to be indexed
        await waitForIndexedEntities(dbConnection, "Product", [product.id])

        // Query the index to verify the product is there
        const resultset = await fetchAndRetry(
          async () =>
            await query.index({
              entity: "product",
              fields: ["id", "title"],
              filters: {
                id: product.id,
              },
            }),
          ({ data }) => data.length === 1,
          { retries: 5, waitSeconds: 2 }
        )

        expect(resultset.data.length).toEqual(1)
        expect(resultset.data[0].title).toEqual("Workflow Created Product")
        expect(resultset.data[0].id).toEqual(product.id)
      })
    })
  },
})
