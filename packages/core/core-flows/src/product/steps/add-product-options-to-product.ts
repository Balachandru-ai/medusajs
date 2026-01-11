import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The data to add one or more product options to products.
 */
export type AddProductOptionsToProductStepInput =
  ProductTypes.ProductOptionProductPair[]

type AddProductOptionsToProductCompensation = {
  removePairs: ProductTypes.ProductOptionProductPair[]
  removeValueUpdates: ProductTypes.ProductOptionProductValueUpdate[]
}

export const addProductOptionsToProductStepId = "add-product-options-to-product"
/**
 * This step adds product options to products.
 */
export const addProductOptionsToProductStep = createStep(
  addProductOptionsToProductStepId,
  async (pairs: AddProductOptionsToProductStepInput, { container }) => {
    if (!pairs.length) {
      return new StepResponse(void 0, {
        removePairs: [],
        removeValueUpdates: [],
      })
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.addProductOptionToProduct(pairs)

    const removePairs = pairs.filter(
      (pair) => !pair.product_option_value_ids
    )
    const removeValueUpdates = pairs
      .filter((pair) => pair.product_option_value_ids?.length)
      .map((pair) => ({
        product_id: pair.product_id,
        product_option_id: pair.product_option_id,
        remove: pair.product_option_value_ids,
      }))

    return new StepResponse(void 0, {
      removePairs,
      removeValueUpdates,
    })
  },
  async (
    compensation: AddProductOptionsToProductCompensation | void,
    { container }
  ) => {
    if (!compensation) {
      return
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    if (compensation.removePairs.length) {
      await service.removeProductOptionFromProduct(compensation.removePairs)
    }

    if (compensation.removeValueUpdates.length) {
      await service.updateProductOptionValuesOnProduct(
        compensation.removeValueUpdates
      )
    }
  }
)
