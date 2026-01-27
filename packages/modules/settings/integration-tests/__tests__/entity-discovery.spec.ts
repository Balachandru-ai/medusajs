import { Modules } from "@medusajs/utils"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { SettingsTypes } from "@medusajs/types"
import { getTestJoinerConfigs } from "../__fixtures__/joiner-configs"

jest.setTimeout(30000)

moduleIntegrationTestRunner<SettingsTypes.ISettingsModuleService>({
  moduleName: Modules.SETTINGS,
  joinerConfig: getTestJoinerConfigs(),
  testSuite: ({ service }) => {
    describe("EntityDiscovery", function () {
      describe("listDiscoverableEntities", function () {
        it("should return list of discoverable entities", async () => {
          const entities = service.listDiscoverableEntities()

          expect(Array.isArray(entities)).toBe(true)
          expect(entities.length).toBeGreaterThan(0)
        })

        it("should return entities with correct AdminEntityInfo shape", async () => {
          const entities = service.listDiscoverableEntities()

          const entity = entities[0]

          // Validate AdminEntityInfo shape
          expect(entity).toHaveProperty("name")
          expect(entity).toHaveProperty("pluralName")
          expect(entity).toHaveProperty("module")
          expect(entity).toHaveProperty("propertyCount")
          expect(entity).toHaveProperty("hasOverrides")

          // Validate types
          expect(typeof entity.name).toBe("string")
          expect(typeof entity.pluralName).toBe("string")
          expect(typeof entity.module).toBe("string")
          expect(typeof entity.propertyCount).toBe("number")
          expect(typeof entity.hasOverrides).toBe("boolean")
        })

        it("should include Product entity from fixture", async () => {
          const entities = service.listDiscoverableEntities()
          const productEntity = entities.find((e) => e.name === "Product")

          expect(productEntity).toBeDefined()
          expect(productEntity?.name).toBe("Product")
          expect(productEntity?.propertyCount).toBeGreaterThan(0)
        })

        it("should include Order entity from fixture", async () => {
          const entities = service.listDiscoverableEntities()
          const orderEntity = entities.find((e) => e.name === "Order")

          expect(orderEntity).toBeDefined()
          expect(orderEntity?.name).toBe("Order")
          expect(orderEntity?.propertyCount).toBeGreaterThan(0)
        })

        it("should include Customer entity from fixture", async () => {
          const entities = service.listDiscoverableEntities()
          const customerEntity = entities.find((e) => e.name === "Customer")

          expect(customerEntity).toBeDefined()
          expect(customerEntity?.name).toBe("Customer")
          expect(customerEntity?.propertyCount).toBeGreaterThan(0)
        })
      })

      describe("hasEntity", function () {
        it("should return true for existing entities", async () => {
          expect(service.hasEntity("Product")).toBe(true)
          expect(service.hasEntity("Order")).toBe(true)
          expect(service.hasEntity("Customer")).toBe(true)
        })

        it("should return false for non-existing entities", async () => {
          expect(service.hasEntity("NonExistentEntity")).toBe(false)
          expect(service.hasEntity("Foo")).toBe(false)
        })

        it("should handle different case variations", async () => {
          expect(service.hasEntity("product")).toBe(true)
          expect(service.hasEntity("PRODUCT")).toBe(true)
          expect(service.hasEntity("Product")).toBe(true)
        })

        it("should handle plural forms", async () => {
          expect(service.hasEntity("products")).toBe(true)
          expect(service.hasEntity("orders")).toBe(true)
          expect(service.hasEntity("customers")).toBe(true)
        })
      })

      describe("generateEntityColumns", function () {
        it("should generate columns for Product entity", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()
          expect(Array.isArray(columns)).toBe(true)
          expect(columns!.length).toBeGreaterThan(0)
        })

        it("should generate columns for Order entity", async () => {
          const columns = await service.generateEntityColumns("Order")

          expect(columns).not.toBeNull()
          expect(Array.isArray(columns)).toBe(true)
          expect(columns!.length).toBeGreaterThan(0)
        })

        it("should return null for non-existing entity", async () => {
          const columns = await service.generateEntityColumns("NonExistent")

          expect(columns).toBeNull()
        })

        it("should return columns with correct AdminColumn shape", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()
          const column = columns![0]

          // Required fields
          expect(column).toHaveProperty("id")
          expect(column).toHaveProperty("name")
          expect(column).toHaveProperty("field")
          expect(column).toHaveProperty("sortable")
          expect(column).toHaveProperty("hideable")
          expect(column).toHaveProperty("default_visible")
          expect(column).toHaveProperty("data_type")

          // Validate types
          expect(typeof column.id).toBe("string")
          expect(typeof column.name).toBe("string")
          expect(typeof column.field).toBe("string")
          expect(typeof column.sortable).toBe("boolean")
          expect(typeof column.hideable).toBe("boolean")
          expect(typeof column.default_visible).toBe("boolean")
          expect(typeof column.data_type).toBe("string")

          // Validate data_type is one of the allowed values
          expect([
            "string",
            "number",
            "boolean",
            "date",
            "currency",
            "enum",
            "object",
          ]).toContain(column.data_type)
        })

        it("should include common Product fields", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()
          const columnIds = columns!.map((c) => c.id)

          // Check for common Product fields from fixture schema
          expect(columnIds).toContain("id")
          expect(columnIds).toContain("title")
          expect(columnIds).toContain("handle")
          expect(columnIds).toContain("status")
        })

        it("should include common Order fields", async () => {
          const columns = await service.generateEntityColumns("Order")

          expect(columns).not.toBeNull()
          const columnIds = columns!.map((c) => c.id)

          // Check for common Order fields from fixture schema
          expect(columnIds).toContain("id")
          expect(columnIds).toContain("status")
          expect(columnIds).toContain("currency_code")
        })

        it("should handle entity lookup with different cases", async () => {
          const columns1 = await service.generateEntityColumns("product")
          const columns2 = await service.generateEntityColumns("Product")
          const columns3 = await service.generateEntityColumns("products")

          expect(columns1).not.toBeNull()
          expect(columns2).not.toBeNull()
          expect(columns3).not.toBeNull()

          // All should return the same columns
          expect(columns1!.length).toBe(columns2!.length)
          expect(columns2!.length).toBe(columns3!.length)
        })

        it("should include render_mode in columns", async () => {
          const columns = await service.generateEntityColumns("Order")

          expect(columns).not.toBeNull()

          // Find timestamp columns which should have datetime render_mode
          const createdAt = columns!.find((c) => c.id === "created_at")!
          expect(createdAt.render_mode).toBe("datetime")

          // Find status column which should have status render_mode
          const status = columns!.find((c) => c.id === "status")!
          expect(status.render_mode).toBe("status")
        })

        it("should include filter configuration in columns", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()

          // Find a filterable column
          const statusColumn = columns!.find((c) => c.id === "status")!
          expect(statusColumn.filter).toHaveProperty("enabled")
          expect(typeof statusColumn.filter!.enabled).toBe("boolean")
        })

        it("should include source information in columns", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()
          const columnWithSource = columns!.find((c) => c.source)!
          expect(columnWithSource.source).toHaveProperty("module")
          expect(columnWithSource.source).toHaveProperty("entity")
        })

        it("should apply custom property labels to columns", async () => {
          await service.createPropertyLabels({
            entity: "Product",
            property: "title",
            label: "Product Name",
          })

          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()
          const titleColumn = columns!.find((c) => c.id === "title")

          expect(titleColumn).toBeDefined()
          expect(titleColumn?.name).toBe("Product Name")
          expect(titleColumn?.custom_label).toBe(true)
        })
      })

      describe("relationship filters", function () {
        it("should include sales_channels relationship filter for Product", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()

          // Find the sales_channels filter column
          const salesChannelsFilter = columns!.find(
            (c) => c.id === "sales_channels_filter"
          )

          expect(salesChannelsFilter).toBeDefined()
          expect(salesChannelsFilter?.filter).toBeDefined()
          expect(salesChannelsFilter?.filter?.enabled).toBe(true)
          expect(salesChannelsFilter?.filter?.relationship).toBeDefined()
          expect(salesChannelsFilter?.filter?.relationship?.entity).toBe(
            "SalesChannel"
          )
          expect(salesChannelsFilter?.filter?.relationship?.value_field).toBe(
            "id"
          )
          expect(salesChannelsFilter?.filter?.relationship?.display_field).toBe(
            "name"
          )
          expect(salesChannelsFilter?.filter?.relationship?.multiple).toBe(true)
          expect(salesChannelsFilter?.filter?.relationship?.endpoint).toBe(
            "/admin/sales-channels"
          )
        })

        it("should include tags relationship filter for Product", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()

          // Find the tags filter column
          const tagsFilter = columns!.find((c) => c.id === "tags_filter")

          expect(tagsFilter).toBeDefined()
          expect(tagsFilter?.filter?.enabled).toBe(true)
          expect(tagsFilter?.filter?.relationship).toBeDefined()
          expect(tagsFilter?.filter?.relationship?.entity).toBe("ProductTag")
          expect(tagsFilter?.filter?.relationship?.multiple).toBe(true)
        })

        it("should include collection relationship for Product", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()

          // Find the collection.title column (single relationship)
          const collectionColumn = columns!.find(
            (c) => c.id === "collection.title"
          )

          expect(collectionColumn).toBeDefined()
          expect(collectionColumn?.category).toBe("relationship")
        })

        it("should include region relationship for Order", async () => {
          const columns = await service.generateEntityColumns("Order")

          expect(columns).not.toBeNull()

          // Find the region.name column (single relationship)
          const regionColumn = columns!.find((c) => c.id === "region.name")

          expect(regionColumn).toBeDefined()
          expect(regionColumn?.category).toBe("relationship")
        })

        it("should have correct RelationshipFilterConfig shape", async () => {
          const columns = await service.generateEntityColumns("Product")

          expect(columns).not.toBeNull()

          const salesChannelsFilter = columns!.find(
            (c) => c.id === "sales_channels_filter"
          )

          expect(salesChannelsFilter?.filter?.relationship).toBeDefined()

          const relationshipConfig = salesChannelsFilter!.filter!.relationship!

          expect(relationshipConfig).toHaveProperty("entity")
          expect(relationshipConfig).toHaveProperty("value_field")
          expect(relationshipConfig).toHaveProperty("display_field")
          expect(relationshipConfig).toHaveProperty("multiple")
          expect(relationshipConfig).toHaveProperty("endpoint")

          expect(typeof relationshipConfig.entity).toBe("string")
          expect(typeof relationshipConfig.value_field).toBe("string")
          expect(typeof relationshipConfig.display_field).toBe("string")
          expect(typeof relationshipConfig.multiple).toBe("boolean")
          expect(typeof relationshipConfig.endpoint).toBe("string")
        })

        it("should include groups relationship filter for Customer", async () => {
          const columns = await service.generateEntityColumns("Customer")

          expect(columns).not.toBeNull()

          // Find the groups filter column
          const groupsFilter = columns!.find((c) => c.id === "groups_filter")

          expect(groupsFilter).toBeDefined()
          expect(groupsFilter?.filter?.enabled).toBe(true)
          expect(groupsFilter?.filter?.relationship).toBeDefined()
          expect(groupsFilter?.filter?.relationship?.entity).toBe(
            "CustomerGroup"
          )
          expect(groupsFilter?.filter?.relationship?.multiple).toBe(true)
        })
      })

      describe("isEntityDiscoveryInitialized", function () {
        it("should return true when entity discovery is initialized", async () => {
          const initialized = service.isEntityDiscoveryInitialized()

          expect(typeof initialized).toBe("boolean")
          expect(initialized).toBe(true)
        })
      })

      describe("entity overrides", function () {
        describe("excludePrefixes", function () {
          it("should exclude fields with raw_ prefix for Order", async () => {
            const columns = await service.generateEntityColumns("Order")

            expect(columns).not.toBeNull()
            const columnIds = columns!.map((c) => c.id)

            // raw_total and raw_subtotal should be excluded
            expect(columnIds).not.toContain("raw_total")
            expect(columnIds).not.toContain("raw_subtotal")
          })

          it("should exclude fields with raw_ prefix for Product", async () => {
            const columns = await service.generateEntityColumns("Product")

            expect(columns).not.toBeNull()
            const columnIds = columns!.map((c) => c.id)

            // raw_price and raw_compare_at_price should be excluded
            expect(columnIds).not.toContain("raw_price")
            expect(columnIds).not.toContain("raw_compare_at_price")
          })
        })

        describe("excludeSuffixes", function () {
          it("should exclude fields with _link suffix for Order", async () => {
            const columns = await service.generateEntityColumns("Order")

            expect(columns).not.toBeNull()
            const columnIds = columns!.map((c) => c.id)

            // customer_link should be excluded
            expect(columnIds).not.toContain("customer_link")
          })

          it("should exclude fields with _link suffix for Product", async () => {
            const columns = await service.generateEntityColumns("Product")

            expect(columns).not.toBeNull()
            const columnIds = columns!.map((c) => c.id)

            // category_link should be excluded
            expect(columnIds).not.toContain("category_link")
          })
        })

        describe("excludeFields", function () {
          it("should exclude specific fields for Order", async () => {
            const columns = await service.generateEntityColumns("Order")

            expect(columns).not.toBeNull()
            const columnIds = columns!.map((c) => c.id)

            // order_change is specifically excluded in Order override
            expect(columnIds).not.toContain("order_change")
          })
        })

        describe("defaultVisibleFields", function () {
          it("should set default_visible for Order configured fields", async () => {
            const columns = await service.generateEntityColumns("Order")

            expect(columns).not.toBeNull()

            // display_id should be default visible for Order
            const displayIdColumn = columns!.find((c) => c.id === "display_id")
            expect(displayIdColumn).toBeDefined()
            expect(displayIdColumn?.default_visible).toBe(true)

            // created_at should be default visible for Order
            const createdAtColumn = columns!.find((c) => c.id === "created_at")
            expect(createdAtColumn).toBeDefined()
            expect(createdAtColumn?.default_visible).toBe(true)

            // payment_status should be default visible for Order
            const paymentStatusColumn = columns!.find(
              (c) => c.id === "payment_status"
            )
            expect(paymentStatusColumn).toBeDefined()
            expect(paymentStatusColumn?.default_visible).toBe(true)

            // fulfillment_status should be default visible for Order
            const fulfillmentStatusColumn = columns!.find(
              (c) => c.id === "fulfillment_status"
            )
            expect(fulfillmentStatusColumn).toBeDefined()
            expect(fulfillmentStatusColumn?.default_visible).toBe(true)
          })

          it("should set default_visible for Product configured fields", async () => {
            const columns = await service.generateEntityColumns("Product")

            expect(columns).not.toBeNull()

            // status should be default visible for Product
            const statusColumn = columns!.find((c) => c.id === "status")
            expect(statusColumn).toBeDefined()
            expect(statusColumn?.default_visible).toBe(true)
          })

          it("should not set default_visible for non-configured fields", async () => {
            const columns = await service.generateEntityColumns("Order")

            expect(columns).not.toBeNull()

            // version should not be default visible for Order
            const versionColumn = columns!.find((c) => c.id === "version")
            expect(versionColumn).toBeDefined()
            expect(versionColumn?.default_visible).toBe(false)

            // metadata should not be default visible
            const metadataColumn = columns!.find((c) => c.id === "metadata")
            if (metadataColumn) {
              expect(metadataColumn.default_visible).toBe(false)
            }
          })
        })

        describe("fieldOrdering", function () {
          it("should order Order fields according to fieldOrdering", async () => {
            const columns = await service.generateEntityColumns("Order")

            expect(columns).not.toBeNull()

            // Get columns with their default_order
            const displayId = columns!.find((c) => c.id === "display_id")
            const createdAt = columns!.find((c) => c.id === "created_at")
            const paymentStatus = columns!.find(
              (c) => c.id === "payment_status"
            )
            const fulfillmentStatus = columns!.find(
              (c) => c.id === "fulfillment_status"
            )
            const total = columns!.find((c) => c.id === "total")

            // Verify fieldOrdering is applied (lower number = earlier in list)
            expect(displayId?.default_order).toBeLessThan(
              createdAt?.default_order || Infinity
            )
            expect(createdAt?.default_order).toBeLessThan(
              fulfillmentStatus?.default_order || Infinity
            )
            expect(fulfillmentStatus?.default_order).toBeLessThan(
              paymentStatus?.default_order || Infinity
            )
            expect(paymentStatus?.default_order).toBeLessThan(
              total?.default_order || Infinity
            )
          })

          it("should sort columns by default_order", async () => {
            const columns = await service.generateEntityColumns("Order")

            expect(columns).not.toBeNull()

            // Verify columns are sorted by default_order
            for (let i = 1; i < columns!.length; i++) {
              const prevOrder = columns![i - 1].default_order || 0
              const currentOrder = columns![i].default_order || 0
              expect(prevOrder).toBeLessThanOrEqual(currentOrder)
            }
          })
        })

        describe("Customer entity overrides", function () {
          it("should generate columns for Customer entity", async () => {
            const columns = await service.generateEntityColumns("Customer")

            expect(columns).not.toBeNull()
            expect(Array.isArray(columns)).toBe(true)
            expect(columns!.length).toBeGreaterThan(0)

            // Should include basic fields
            const columnIds = columns!.map((c) => c.id)
            expect(columnIds).toContain("id")
            expect(columnIds).toContain("email")
          })

          it("should set default_visible for Customer configured fields", async () => {
            const columns = await service.generateEntityColumns("Customer")

            expect(columns).not.toBeNull()

            // email should be default visible for Customer
            const emailColumn = columns!.find((c) => c.id === "email")
            expect(emailColumn).toBeDefined()
            expect(emailColumn?.default_visible).toBe(true)

            // first_name should be default visible for Customer
            const firstNameColumn = columns!.find((c) => c.id === "first_name")
            expect(firstNameColumn).toBeDefined()
            expect(firstNameColumn?.default_visible).toBe(true)

            // last_name should be default visible for Customer
            const lastNameColumn = columns!.find((c) => c.id === "last_name")
            expect(lastNameColumn).toBeDefined()
            expect(lastNameColumn?.default_visible).toBe(true)
          })

          it("should apply filter rules for Customer", async () => {
            const columns = await service.generateEntityColumns("Customer")

            expect(columns).not.toBeNull()
            const columnIds = columns!.map((c) => c.id)

            // _link suffix fields should be excluded
            const linkColumns = columnIds.filter((id) => id.endsWith("_link"))
            expect(linkColumns.length).toBe(0)

            // raw_ prefix fields should be excluded
            const rawColumns = columnIds.filter((id) => id.startsWith("raw_"))
            expect(rawColumns.length).toBe(0)
          })
        })

        describe("hasOverrides in entity info", function () {
          it("should report hasOverrides=true for entities with custom overrides", async () => {
            const entities = service.listDiscoverableEntities()

            const orderEntity = entities.find((e) => e.name === "Order")
            const productEntity = entities.find((e) => e.name === "Product")

            // Order and Product have explicit overrides in ENTITY_OVERRIDES
            expect(orderEntity?.hasOverrides).toBe(true)
            expect(productEntity?.hasOverrides).toBe(true)
          })

          it("should report hasOverrides accurately for all entities", async () => {
            const entities = service.listDiscoverableEntities()

            for (const entity of entities) {
              expect(typeof entity.hasOverrides).toBe("boolean")
            }
          })
        })
      })
    })
  },
})
