import {
  setProductProductOptionsWorkflow,
  setProductProductOptionsWorkflowId,
  updateProductOptionsWorkflow,
} from "@medusajs/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IFulfillmentModuleService,
  IProductModuleService,
} from "@medusajs/types"
import { Modules } from "@medusajs/utils"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Workflows: Update product options", () => {
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

      describe("updateProductOptionsWorkflow", () => {
        it("should fail to remove an option value that is associated with a product", async () => {
          const workflow = updateProductOptionsWorkflow(appContainer)

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

          expect(option.values).toHaveLength(3)

          const { errors } = await workflow.run({
            input: {
              selector: { id: option.id },
              update: {
                values: ["S", "M"], // Removing "L"
              },
            },
            throwOnError: false,
          })

          expect(errors).toHaveLength(1)
          const error = errors[0].error

          expect(error.message).toContain(
            "Cannot delete product option values that are associated with products."
          )

          // Verify the option still has all values
          const updatedOption = await service.listProductOptions(
            {
              id: [option.id],
            },
            { relations: ["values"] }
          )
          expect(updatedOption[0].values).toHaveLength(3)
          expect(updatedOption[0].values.map((v) => v.value)).toEqual(
            expect.arrayContaining(["S", "M", "L"])
          )
        })

        it("should successfully remove option values that are not associated with products", async () => {
          const workflow = updateProductOptionsWorkflow(appContainer)

          const option = await service.createProductOptions({
            title: "Color",
            is_exclusive: false,
            values: ["Red", "Blue", "Green"],
          })

          expect(option.values).toHaveLength(3)

          await workflow.run({
            input: {
              selector: { id: option.id },
              update: {
                values: ["Red", "Blue"], // Removing "Green"
              },
            },
          })

          const updatedOption = await service.listProductOptions(
            {
              id: [option.id],
            },
            { relations: ["values"] }
          )
          expect(updatedOption[0].values).toHaveLength(2)
          expect(updatedOption[0].values.map((v) => v.value)).toEqual(
            expect.arrayContaining(["Red", "Blue"])
          )
        })

        it("should successfully update option values when adding new values and removing unassociated ones", async () => {
          const workflow = updateProductOptionsWorkflow(appContainer)

          // Create a product with an option that has some values
          const product = await service.createProducts({
            title: "Test Product",
            shipping_profile_id: shippingProfile.id,
            options: [
              {
                title: "Material",
                values: ["Cotton", "Polyester"],
              },
            ],
          })

          const option = product.options[0]

          // Create a standalone option with values that we'll update
          const standaloneOption = await service.createProductOptions({
            title: "Pattern",
            is_exclusive: false,
            values: ["Striped", "Solid"],
          })

          expect(standaloneOption.values).toHaveLength(2)

          // Update: remove "Solid", add "New"
          await workflow.run({
            input: {
              selector: { id: standaloneOption.id },
              update: {
                values: ["Striped", "New"],
              },
            },
          })

          const updatedOption = await service.listProductOptions(
            {
              id: [standaloneOption.id],
            },
            { relations: ["values"] }
          )
          expect(updatedOption[0].values).toHaveLength(2)
          expect(updatedOption[0].values.map((v) => v.value)).toEqual(
            expect.arrayContaining(["Striped", "New"])
          )

          const productOption = await service.listProductOptions(
            {
              id: [option.id],
            },
            { relations: ["values"] }
          )
          expect(productOption[0].values).toHaveLength(2)
        })
      })

      describe("setProductProductOptionsWorkflow", () => {
        describe("compensation", () => {
          it("should restore only the linked option values after a failed removal", async () => {
            const workflow = setProductProductOptionsWorkflow(appContainer)

            workflow.appendAction("throw", setProductProductOptionsWorkflowId, {
              invoke: async function failStep() {
                throw new Error(`Fail`)
              },
            })

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
            const valueToRemove = option.values?.find(
              (value) => value.value === "L"
            )

            await service.updateProductOptionValuesOnProduct({
              product_id: product.id,
              product_option_id: option.id,
              remove: [valueToRemove!.id],
            })

            const [productWithPartialValues] = await service.listProducts(
              { id: [product.id] },
              { relations: ["options.values"] }
            )

            const initialValues = productWithPartialValues.options[0].values.map(
              (value) => value.value
            )

            expect(initialValues).toHaveLength(2)
            expect(initialValues).toEqual(expect.arrayContaining(["S", "M"]))

            const { errors } = await workflow.run({
              input: {
                product_id: product.id,
                remove: [option.id],
              },
              throwOnError: false,
            })

            expect(errors).toEqual([
              {
                action: "throw",
                handlerType: "invoke",
                error: expect.objectContaining({
                  message: `Fail`,
                }),
              },
            ])

            const [compensatedProduct] = await service.listProducts(
              { id: [product.id] },
              { relations: ["options.values"] }
            )

            const compensatedValues = compensatedProduct.options[0].values.map(
              (value) => value.value
            )

            expect(compensatedValues).toHaveLength(2)
            expect(compensatedValues).toEqual(
              expect.arrayContaining(["S", "M"])
            )
          })

          it("should not invert no-op updates when compensating", async () => {
            const workflow = setProductProductOptionsWorkflow(appContainer)

            workflow.appendAction("throw", setProductProductOptionsWorkflowId, {
              invoke: async function failStep() {
                throw new Error(`Fail`)
              },
            })

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
            const valueToRemove = option.values?.find(
              (value) => value.value === "L"
            )
            const valueToRemoveExisting = option.values?.find(
              (value) => value.value === "S"
            )
            const valueToKeep = option.values?.find(
              (value) => value.value === "M"
            )

            await service.updateProductOptionValuesOnProduct({
              product_id: product.id,
              product_option_id: option.id,
              remove: [valueToRemove!.id],
            })

            const [productWithPartialValues] = await service.listProducts(
              { id: [product.id] },
              { relations: ["options.values"] }
            )

            const initialValues = productWithPartialValues.options[0].values.map(
              (value) => value.value
            )

            expect(initialValues).toHaveLength(2)
            expect(initialValues).toEqual(expect.arrayContaining(["S", "M"]))

            const { errors } = await workflow.run({
              input: {
                product_id: product.id,
                update: [
                  {
                    product_option_id: option.id,
                    add: [valueToKeep!.id],
                    remove: [valueToRemove!.id, valueToRemoveExisting!.id],
                  },
                ],
              },
              throwOnError: false,
            })

            expect(errors).toEqual([
              {
                action: "throw",
                handlerType: "invoke",
                error: expect.objectContaining({
                  message: `Fail`,
                }),
              },
            ])

            const [compensatedProduct] = await service.listProducts(
              { id: [product.id] },
              { relations: ["options.values"] }
            )

            const compensatedValues = compensatedProduct.options[0].values.map(
              (value) => value.value
            )

            expect(compensatedValues).toHaveLength(2)
            expect(compensatedValues).toEqual(
              expect.arrayContaining(["S", "M"])
            )
          })
        })
      })
    })
  },
})
