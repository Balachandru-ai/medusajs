import { deleteProductOptionsWorkflow } from "@medusajs/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IFulfillmentModuleService,
  IProductModuleService,
} from "@medusajs/types"
import { Modules } from "@medusajs/utils"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  env: {},
  testSuite: ({ getContainer }) => {
    describe("Workflows: Delete product options", () => {
      let appContainer
      let service: IProductModuleService
      let fulfillmentService: IFulfillmentModuleService
      let shippingProfile

      beforeAll(async () => {
        appContainer = getContainer()
        service = appContainer.resolve(Modules.PRODUCT)
        fulfillmentService = appContainer.resolve(Modules.FULFILLMENT)
      })

      beforeEach(async () => {
        shippingProfile = await fulfillmentService.createShippingProfiles({
          name: "Test",
          type: "default",
        })
      })

      describe("deleteProductOptionsWorkflow", () => {
        it("should fail to delete an exclusive option with associated products", async () => {
          const workflow = deleteProductOptionsWorkflow(appContainer)

          const product = await service.createProducts({
            title: "Test Product",
            shipping_profile_id: shippingProfile.id,
            options: [
              {
                title: "Size",
                values: ["S", "M", "L"],
              },
            ],
          })

          const option = product.options[0]

          expect(option.is_exclusive).toBe(true)

          const { errors } = await workflow.run({
            input: {
              ids: [option.id],
            },
            throwOnError: false,
          })

          expect(errors).toHaveLength(1)
          const error = errors[0].error
          expect(error).toBeDefined()
          const errorMessage =
            error.message || error.toString() || JSON.stringify(error)
          expect(errorMessage).toContain("Cannot delete product option(s)")
          expect(errorMessage).toContain("Size")
          expect(errorMessage).toContain("associated with one or more products")

          const options = await service.listProductOptions({ id: [option.id] })
          expect(options).toHaveLength(1)
          expect(options[0].id).toBe(option.id)
        })

        it("should successfully delete a non-exclusive option without associated products", async () => {
          const workflow = deleteProductOptionsWorkflow(appContainer)

          const option = await service.createProductOptions({
            title: "Color",
            is_exclusive: false,
            values: [
              {
                value: "Red",
              },
              {
                value: "Blue",
              },
            ],
          })

          expect(option.is_exclusive).toBe(false)

          await workflow.run({
            input: {
              ids: [option.id],
            },
          })

          const options = await service.listProductOptions({ id: [option.id] })
          expect(options).toHaveLength(0)
        })

        it("should fail to delete a non-exclusive option with associated products", async () => {
          const workflow = deleteProductOptionsWorkflow(appContainer)

          const product = await service.createProducts({
            title: "Test Product",
            shipping_profile_id: shippingProfile.id,
          })

          const option = await service.createProductOptions({
            title: "Material",
            is_exclusive: false,
            values: [
              {
                value: "Cotton",
              },
              {
                value: "Polyester",
              },
            ],
          })

          await service.addProductOptionToProduct({
            product_id: product.id,
            product_option_id: option.id,
          })

          const { errors } = await workflow.run({
            input: {
              ids: [option.id],
            },
            throwOnError: false,
          })

          expect(errors).toHaveLength(1)
          const error = errors[0].error
          expect(error).toBeDefined()
          const errorMessage =
            error.message || error.toString() || JSON.stringify(error)
          expect(errorMessage).toContain("Cannot delete product option(s)")
          expect(errorMessage).toContain("Material")
          expect(errorMessage).toContain("associated with one or more products")

          const options = await service.listProductOptions({ id: [option.id] })
          expect(options).toHaveLength(1)
          expect(options[0].id).toBe(option.id)
        })
      })
    })
  },
})
