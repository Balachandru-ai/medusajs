import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The data to update product option values linked to products.
 */
export type UpdateProductOptionValuesOnProductStepInput =
  ProductTypes.ProductOptionProductValueUpdate[]

export const updateProductOptionValuesOnProductStepId =
  "update-product-option-values-on-product"
/**
 * This step updates product option values linked to products.
 */
export const updateProductOptionValuesOnProductStep = createStep(
  updateProductOptionValuesOnProductStepId,
  async (
    updates: UpdateProductOptionValuesOnProductStepInput,
    { container }
  ) => {
    const effectiveUpdates = updates.filter(
      (pair) => (pair.add?.length ?? 0) > 0 || (pair.remove?.length ?? 0) > 0
    )

    if (!effectiveUpdates.length) {
      return new StepResponse(void 0, [])
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.updateProductOptionValuesOnProduct(effectiveUpdates)

    const compensation = effectiveUpdates
      .map((pair) => ({
        product_id: pair.product_id,
        product_option_id: pair.product_option_id,
        add: pair.remove,
        remove: pair.add,
      }))
      .filter(
        (pair) => (pair.add?.length ?? 0) > 0 || (pair.remove?.length ?? 0) > 0
      )

    return new StepResponse(void 0, compensation)
  },
  async (
    compensation: UpdateProductOptionValuesOnProductStepInput | void,
    { container }
  ) => {
    if (!compensation?.length) {
      return
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.updateProductOptionValuesOnProduct(compensation)
  }
)
