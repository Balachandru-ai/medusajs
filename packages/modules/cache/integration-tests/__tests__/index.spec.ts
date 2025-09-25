import { Modules } from "@medusajs/framework/utils"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { ICachingModuleService } from "@medusajs/framework/types"
import { MedusaModule } from "@medusajs/framework/modules-sdk"

jest.setTimeout(10000)

jest.spyOn(MedusaModule, "getAllJoinerConfigs").mockReturnValue([
  {
    schema: `
   type Product {
    id: ID
    title: String
    handle: String
    status: String
    type_id: String
    collection_id: String
    is_giftcard: Boolean
    external_id: String
    created_at: DateTime
    updated_at: DateTime

    variants: [ProductVariant]
    sales_channels: [SalesChannel]
  }

  type ProductVariant {
    id: ID
    product_id: String
    sku: String

    prices: [Price]
  }
  
  type Price {
    id: ID
    amount: Float
    currency_code: String
  }

  type SalesChannel {
    id: ID
    is_disabled: Boolean
  }
`,
  },
])

moduleIntegrationTestRunner<ICachingModuleService>({
  moduleName: Modules.CACHING,
  testSuite: ({ service }) => {
    describe("Caching Module Service", () => {
      beforeEach(async () => {
        // Clear all cache data before each test
        await service.clear({ tags: ["*"] }).catch(() => {})
      })

      describe("Basic Cache Operations", () => {
        it("should set and get cache data with default memory provider", async () => {
          const testData = { id: "test-id", name: "Test Item" }

          await service.set({
            key: "test-key",
            data: testData,
            ttl: 3600,
          })

          const result = await service.get({ key: "test-key" })
          expect(result).toEqual(testData)
        })

        it("should return null for non-existent keys", async () => {
          const result = await service.get({ key: "non-existent" })
          expect(result).toBeNull()
        })

        it("should handle tags-based storage and retrieval", async () => {
          const testData1 = { id: "1", name: "Item 1" }
          const testData2 = { id: "2", name: "Item 2" }

          await service.set({
            key: "item-1",
            data: testData1,
            tags: ["product", "active"],
          })

          await service.set({
            key: "item-2",
            data: testData2,
            tags: ["product", "inactive"],
          })

          const productResults = await service.get({ tags: ["product"] })
          expect(productResults).toHaveLength(2)
          expect(productResults).toContainEqual(testData1)
          expect(productResults).toContainEqual(testData2)

          const activeResults = await service.get<any[]>({ tags: ["active"] })
          expect(activeResults).toHaveLength(1)
          expect(activeResults?.[0]).toEqual(testData1)
        })

        it("should clear cache by key", async () => {
          await service.set({
            key: "test-key",
            data: { value: "test" },
          })

          await service.clear({ key: "test-key" })

          const result = await service.get({ key: "test-key" })
          expect(result).toBeNull()
        })

        it("should clear cache by tags", async () => {
          await service.set({
            key: "item-1",
            data: { id: "1" },
            tags: ["category-a"],
          })

          await service.set({
            key: "item-2",
            data: { id: "2" },
            tags: ["category-b"],
          })

          await service.clear({ tags: ["category-a"] })

          const result1 = await service.get({ key: "item-1" })
          const result2 = await service.get({ key: "item-2" })

          expect(result1).toBeNull()
          expect(result2).toEqual({ id: "2" })
        })
      })

      describe("Provider Priority", () => {
        it("should check providers in order of priority when specified", async () => {
          // Since we only have memory provider in this test, we'll simulate
          // the behavior by using the providers array
          const testData = { id: "priority-test", name: "Priority Test" }

          await service.set({
            key: "priority-key",
            data: testData,
            providers: ["cache-memory"],
          })

          const result = await service.get({
            key: "priority-key",
            providers: ["cache-memory"],
          })

          expect(result).toEqual(testData)
        })

        it("should return null when providers array is empty or invalid", async () => {
          const result = await service.get({
            key: "test-key",
            providers: [],
          })

          expect(result).toBeNull()
        })
      })

      describe("Promise Deduplication", () => {
        it("should deduplicate concurrent get requests with same parameters", async () => {
          const testData = { id: "concurrent-test", name: "Concurrent Test" }

          await service.set({
            key: "concurrent-key",
            data: testData,
          })

          // Make multiple concurrent requests for the same key
          const promises = Array.from({ length: 5 }, () =>
            service.get<any>({ key: "concurrent-key" })
          )

          const results = await Promise.all(promises)

          // All should return the same result
          results.forEach((result) => {
            expect(result).toEqual(testData)
          })
        })

        it("should deduplicate concurrent get requests with same tags", async () => {
          const testData = { id: "tag-test", name: "Tag Test" }

          await service.set({
            key: "tag-key",
            data: testData,
            tags: ["concurrent-tag"],
          })

          // Make multiple concurrent requests for the same tags
          const promises = Array.from({ length: 5 }, () =>
            service.get<any[]>({ tags: ["concurrent-tag"] })
          )

          const results = await Promise.all(promises)

          // All should return the same result
          results.forEach((result) => {
            expect(result).toHaveLength(1)
            expect(result?.[0]).toEqual(testData)
          })
        })

        it("should deduplicate concurrent clear requests", async () => {
          // Set up test data
          await service.set({
            key: "clear-test-1",
            data: { id: "1" },
            tags: ["clear-tag"],
          })

          await service.set({
            key: "clear-test-2",
            data: { id: "2" },
            tags: ["clear-tag"],
          })

          // Make multiple concurrent clear requests
          const promises = Array.from({ length: 3 }, () =>
            service.clear({ tags: ["clear-tag"] })
          )

          await Promise.all(promises)

          // Verify data was cleared
          const result1 = await service.get({ key: "clear-test-1" })
          const result2 = await service.get({ key: "clear-test-2" })

          expect(result1).toBeNull()
          expect(result2).toBeNull()
        })

        it("should handle concurrent requests with different parameters separately", async () => {
          const testData1 = { id: "1", name: "Item 1" }
          const testData2 = { id: "2", name: "Item 2" }

          await service.set({ key: "key-1", data: testData1 })
          await service.set({ key: "key-2", data: testData2 })

          // Make concurrent requests for different keys
          const promises = [
            service.get({ key: "key-1" }),
            service.get({ key: "key-1" }),
            service.get({ key: "key-2" }),
            service.get({ key: "key-2" }),
          ]

          const results = await Promise.all(promises)

          expect(results[0]).toEqual(testData1)
          expect(results[1]).toEqual(testData1)
          expect(results[2]).toEqual(testData2)
          expect(results[3]).toEqual(testData2)
        })
      })

      describe("Memory Cache Provider Integration", () => {
        it("should respect TTL settings", async () => {
          const testData = { id: "ttl-test", name: "TTL Test" }

          // Set with very short TTL (1 second)
          await service.set({
            key: "ttl-key",
            data: testData,
            ttl: 1,
          })

          // Should be available immediately
          let result = await service.get({ key: "ttl-key" })
          expect(result).toEqual(testData)

          // Wait for expiry and check
          await new Promise((resolve) => setTimeout(resolve, 1100))

          result = await service.get({ key: "ttl-key" })
          expect(result).toBeNull()
        })

        it("should handle autoInvalidate option", async () => {
          const testData = { id: "no-auto-test", name: "No Auto Test" }

          await service.set({
            key: "no-auto-key",
            data: testData,
            tags: ["no-auto-tag"],
            options: { autoInvalidate: false },
          })

          // Try to clear by tag (should not clear due to autoInvalidate)
          await service.clear({
            tags: ["no-auto-tag"],
            options: { autoInvalidate: true },
          })

          const result = await service.get({ key: "no-auto-key" })
          expect(result).toEqual(testData)

          // Force clear should work
          await service.clear({
            tags: ["no-auto-tag"],
          })

          const result2 = await service.get({ key: "no-auto-key" })
          expect(result2).toBeNull()
        })

        it("should generate consistent cache keys", async () => {
          const testInput = { userId: "123", action: "view" }

          const key1 = await service.computeKey(testInput)
          const key2 = await service.computeKey(testInput)

          expect(key1).toBe(key2)
          expect(typeof key1).toBe("string")
          expect(key1.length).toBeGreaterThan(0)
        })

        it("should generate cache tags", async () => {
          const testInput = { id: "prod_1", title: "123", description: "456" }

          const tags = await service.computeTags(testInput)

          expect(Array.isArray(tags)).toBe(true)
          expect(tags.length).toBeGreaterThan(0)
        })
      })

      describe("Error Handling", () => {
        it("should throw error when neither key nor tags provided to get", async () => {
          await expect(service.get({})).rejects.toThrow(
            "Either key or tags must be provided"
          )
        })

        it("should throw error when neither key nor tags provided to clear", async () => {
          await expect(service.clear({})).rejects.toThrow(
            "Either key or tags must be provided"
          )
        })
      })
    })
  },
})
