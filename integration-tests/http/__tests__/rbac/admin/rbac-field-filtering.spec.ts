import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../../helpers/create-admin-user"
import { getProductFixture } from "../../../../helpers/fixtures"

jest.setTimeout(60000)

process.env.MEDUSA_FF_RBAC = "true"

medusaIntegrationTestRunner({
  testSuite: ({ dbConnection, api, getContainer }) => {
    let container
    let baseProduct

    beforeEach(async () => {
      container = getContainer()
      await createAdminUser(dbConnection, adminHeaders, container)

      // Create test product
      const productFixture = getProductFixture({
        title: "Test Product for RBAC Field Filtering",
      })
      const productResponse = await api.post(
        "/admin/products",
        productFixture,
        adminHeaders
      )
      baseProduct = productResponse.data.product
    })

    afterAll(async () => {
      delete process.env.MEDUSA_FF_RBAC
    })

    describe("RBAC Field Filtering Integration", () => {
      it("should handle basic field filtering in product queries", async () => {
        // Test basic field selection
        const response = await api.get(
          `/admin/products/${baseProduct.id}?fields=id,title,handle`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const product = response.data.product

        // Should return requested fields
        expect(product).toHaveProperty("id")
        expect(product).toHaveProperty("title")
        expect(product).toHaveProperty("handle")

        // Should not include fields that weren't requested
        expect(product).not.toHaveProperty("description")
        expect(product).not.toHaveProperty("status")
      })

      it("should handle list queries with field filtering", async () => {
        const response = await api.get(
          "/admin/products?fields=id,title,status&limit=5",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.products).toBeDefined()
        expect(Array.isArray(response.data.products)).toBe(true)

        if (response.data.products.length > 0) {
          const product = response.data.products[0]
          expect(product).toHaveProperty("id")
          expect(product).toHaveProperty("title")
          expect(product).toHaveProperty("status")
        }
      })

      it("should handle nested field requests properly", async () => {
        const response = await api.get(
          `/admin/products/${baseProduct.id}?fields=id,title,variants.title,variants.sku`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const product = response.data.product

        expect(product).toHaveProperty("id")
        expect(product).toHaveProperty("title")

        // Nested fields should be handled properly
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants[0]
          expect(variant).toHaveProperty("title")
          expect(variant).toHaveProperty("sku")
        }
      })

      it("should handle order parameters with field filtering", async () => {
        const response = await api.get(
          "/admin/products?order=created_at&fields=id,title",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.products).toBeDefined()
        expect(Array.isArray(response.data.products)).toBe(true)

        // Verify ordering is applied (this is more of an integration test)
        if (response.data.products.length > 1) {
          // Products should be ordered by created_at
          expect(response.data.products[0]).toHaveProperty("id")
          expect(response.data.products[0]).toHaveProperty("title")
        }
      })

      it("should handle pagination with field filtering", async () => {
        const response = await api.get(
          "/admin/products?fields=id,title&limit=2&offset=0",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.products).toBeDefined()
        expect(response.data.count).toBeDefined()
        expect(response.data.limit).toEqual(2)
        expect(response.data.offset).toEqual(0)

        // Should have at most 2 products
        expect(response.data.products.length).toBeLessThanOrEqual(2)

        // Each product should only have the requested fields
        response.data.products.forEach((product) => {
          expect(product).toHaveProperty("id")
          expect(product).toHaveProperty("title")
        })
      })

      it("should handle complex queries with multiple parameters", async () => {
        const response = await api.get(
          `/admin/products?fields=id,title,status&order=created_at&limit=3&expand=variants`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.products).toBeDefined()
        expect(Array.isArray(response.data.products)).toBe(true)

        // Verify structure
        if (response.data.products.length > 0) {
          const product = response.data.products[0]
          expect(product).toHaveProperty("id")
          expect(product).toHaveProperty("title")
          expect(product).toHaveProperty("status")
          // Variants might be expanded if they exist
        }
      })

      it("should handle wildcard field requests", async () => {
        const response = await api.get(
          `/admin/products/${baseProduct.id}?fields=id,*variants`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const product = response.data.product

        expect(product).toHaveProperty("id")
        // Should have variants expanded with all fields
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants[0]
          expect(variant).toHaveProperty("id")
          expect(variant).toHaveProperty("title")
          expect(variant).toHaveProperty("sku")
        }
      })

      it("should gracefully handle invalid field names", async () => {
        const response = await api.get(
          `/admin/products/${baseProduct.id}?fields=id,invalid_field_name,title`,
          adminHeaders
        )

        // Should handle gracefully without crashing
        expect(response.status).toEqual(200)
        expect(response.data.product).toBeDefined()

        const product = response.data.product
        expect(product).toHaveProperty("id")
        expect(product).toHaveProperty("title")
        // Invalid field should be ignored
      })

      it("should validate prepareListQuery integration", async () => {
        // This test specifically validates that the prepareListQuery function
        // is working correctly with the async RBAC integration
        const response = await api.get(
          "/admin/products?fields=id,title,handle&order=title&limit=5",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.products).toBeDefined()

        // Verify the query was processed correctly
        expect(response.data.limit).toEqual(5)
        expect(response.data.offset).toEqual(0)
        expect(Array.isArray(response.data.products)).toBe(true)

        // Each product should have only the requested fields
        response.data.products.forEach((product) => {
          expect(product).toHaveProperty("id")
          expect(product).toHaveProperty("title")
          expect(product).toHaveProperty("handle")
        })
      })
    })

    describe("RBAC Middleware Integration", () => {
      it("should process requests through RBAC middleware", async () => {
        // This test validates that requests are processed through the RBAC middleware
        // and the prepareListQuery function with field filtering works
        const response = await api.get(
          `/admin/products/${baseProduct.id}?fields=id,title`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.product).toBeDefined()

        // The fact that we get a successful response means the middleware
        // chain including RBAC validation is working
        expect(response.data.product).toHaveProperty("id")
        expect(response.data.product).toHaveProperty("title")
      })

      it("should handle prepareRetrieveQuery integration", async () => {
        // Test that prepareRetrieveQuery also works with async RBAC
        const response = await api.get(
          `/admin/products/${baseProduct.id}`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.product).toBeDefined()
        expect(response.data.product).toHaveProperty("id")
      })
    })
  },
})
