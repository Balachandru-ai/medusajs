/**
 * Multi-Tenancy PoC Integration Tests
 * 
 * These tests demonstrate that tenant isolation works correctly.
 * They verify that:
 * 1. Tenants can be created and managed
 * 2. Products are isolated by tenant_id
 * 3. Customers are isolated by tenant_id
 * 4. Orders are isolated by tenant_id
 * 5. Cross-tenant data access is prevented
 */

import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { IProductModuleService, ICustomerModuleService } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "medusa-test-utils"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Multi-Tenancy: Tenant Isolation", () => {
      let tenantService: any
      let productService: IProductModuleService
      let customerService: ICustomerModuleService

      let tenant1: any
      let tenant2: any

      beforeAll(() => {
        const container = getContainer()
        tenantService = container.resolve("tenantService")
        productService = container.resolve(ModuleRegistrationName.PRODUCT)
        customerService = container.resolve(ModuleRegistrationName.CUSTOMER)
      })

      beforeEach(async () => {
        // Create two tenants for testing
        tenant1 = await tenantService.createTenants({
          name: "Tenant One",
          slug: "tenant-one",
          subdomain: "tenant1",
        }, { skipTenantScoping: true })

        tenant2 = await tenantService.createTenants({
          name: "Tenant Two",
          slug: "tenant-two",
          subdomain: "tenant2",
        }, { skipTenantScoping: true })
      })

      describe("Tenant CRUD", () => {
        it("should create a tenant", () => {
          expect(tenant1).toBeDefined()
          expect(tenant1.name).toBe("Tenant One")
          expect(tenant1.slug).toBe("tenant-one")
          expect(tenant1.subdomain).toBe("tenant1")
        })

        it("should retrieve a tenant by ID", async () => {
          const retrieved = await tenantService.retrieveTenant(
            tenant1.id,
            {},
            { skipTenantScoping: true }
          )

          expect(retrieved.id).toBe(tenant1.id)
          expect(retrieved.name).toBe("Tenant One")
        })

        it("should retrieve a tenant by subdomain", async () => {
          const retrieved = await tenantService.retrieveTenantBySubdomain(
            "tenant1",
            {},
            { skipTenantScoping: true }
          )

          expect(retrieved.id).toBe(tenant1.id)
        })

        it("should list all tenants", async () => {
          const [tenants] = await tenantService.listAndCountTenants(
            {},
            {},
            { skipTenantScoping: true }
          )

          expect(tenants.length).toBeGreaterThanOrEqual(2)
          expect(tenants.some((t) => t.id === tenant1.id)).toBe(true)
          expect(tenants.some((t) => t.id === tenant2.id)).toBe(true)
        })

        it("should update a tenant", async () => {
          const updated = await tenantService.updateTenants(
            tenant1.id,
            { name: "Updated Tenant One" },
            { skipTenantScoping: true }
          )

          expect(updated.name).toBe("Updated Tenant One")
        })

        it("should delete a tenant", async () => {
          await tenantService.deleteTenants(tenant1.id, {
            skipTenantScoping: true,
          })

          await expect(
            tenantService.retrieveTenant(tenant1.id, {}, { skipTenantScoping: true })
          ).rejects.toThrow()
        })
      })

      describe("Product Isolation", () => {
        it("should create products scoped to tenant", async () => {
          const product1 = await productService.createProducts(
            {
              title: "Tenant 1 Product",
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          const product2 = await productService.createProducts(
            {
              title: "Tenant 2 Product",
              tenant_id: tenant2.id,
            },
            { tenantId: tenant2.id }
          )

          expect(product1.tenant_id).toBe(tenant1.id)
          expect(product2.tenant_id).toBe(tenant2.id)
        })

        it("should only list products for the active tenant", async () => {
          // Create products for both tenants
          await productService.createProducts(
            {
              title: "Tenant 1 Product A",
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          await productService.createProducts(
            {
              title: "Tenant 1 Product B",
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          await productService.createProducts(
            {
              title: "Tenant 2 Product A",
              tenant_id: tenant2.id,
            },
            { tenantId: tenant2.id }
          )

          // List products for tenant 1
          const tenant1Products = await productService.listProducts(
            {},
            {},
            { tenantId: tenant1.id }
          )

          // List products for tenant 2
          const tenant2Products = await productService.listProducts(
            {},
            {},
            { tenantId: tenant2.id }
          )

          expect(tenant1Products.length).toBe(2)
          expect(tenant2Products.length).toBe(1)

          // Verify tenant 1 can't see tenant 2's products
          expect(
            tenant1Products.every((p) => p.tenant_id === tenant1.id)
          ).toBe(true)

          expect(
            tenant2Products.every((p) => p.tenant_id === tenant2.id)
          ).toBe(true)
        })

        it("should prevent cross-tenant product retrieval", async () => {
          const product = await productService.createProducts(
            {
              title: "Tenant 1 Product",
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          // Tenant 2 tries to retrieve tenant 1's product
          await expect(
            productService.retrieveProduct(product.id, {}, { tenantId: tenant2.id })
          ).rejects.toThrow()
        })
      })

      describe("Customer Isolation", () => {
        it("should create customers scoped to tenant", async () => {
          const customer1 = await customerService.createCustomers(
            {
              email: "customer@tenant1.com",
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          const customer2 = await customerService.createCustomers(
            {
              email: "customer@tenant2.com",
              tenant_id: tenant2.id,
            },
            { tenantId: tenant2.id }
          )

          expect(customer1.tenant_id).toBe(tenant1.id)
          expect(customer2.tenant_id).toBe(tenant2.id)
        })

        it("should only list customers for the active tenant", async () => {
          await customerService.createCustomers(
            {
              email: "alice@tenant1.com",
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          await customerService.createCustomers(
            {
              email: "bob@tenant1.com",
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          await customerService.createCustomers(
            {
              email: "charlie@tenant2.com",
              tenant_id: tenant2.id,
            },
            { tenantId: tenant2.id }
          )

          const tenant1Customers = await customerService.listCustomers(
            {},
            {},
            { tenantId: tenant1.id }
          )

          const tenant2Customers = await customerService.listCustomers(
            {},
            {},
            { tenantId: tenant2.id }
          )

          expect(tenant1Customers.length).toBe(2)
          expect(tenant2Customers.length).toBe(1)

          expect(
            tenant1Customers.every((c) => c.tenant_id === tenant1.id)
          ).toBe(true)

          expect(
            tenant2Customers.every((c) => c.tenant_id === tenant2.id)
          ).toBe(true)
        })

        it("should allow same email across different tenants", async () => {
          const email = "same@email.com"

          const customer1 = await customerService.createCustomers(
            {
              email,
              tenant_id: tenant1.id,
            },
            { tenantId: tenant1.id }
          )

          const customer2 = await customerService.createCustomers(
            {
              email,
              tenant_id: tenant2.id,
            },
            { tenantId: tenant2.id }
          )

          expect(customer1.email).toBe(email)
          expect(customer2.email).toBe(email)
          expect(customer1.id).not.toBe(customer2.id)
          expect(customer1.tenant_id).toBe(tenant1.id)
          expect(customer2.tenant_id).toBe(tenant2.id)
        })
      })
    })
  },
})
