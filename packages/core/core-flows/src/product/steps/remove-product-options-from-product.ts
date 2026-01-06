import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The data to remove one or more product options from products.
 */
export type RemoveProductOptionsFromProductStepInput =
  ProductTypes.ProductOptionProductPair[]

export const removeProductOptionsFromProductStepId =
  "remove-product-options-from-product"
/**
 * This step removes product options from products.
 */
export const removeProductOptionsFromProductStep = createStep(
  removeProductOptionsFromProductStepId,
  async (pairs: RemoveProductOptionsFromProductStepInput, { container }) => {
    if (!pairs.length) {
      return new StepResponse(void 0, [])
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.removeProductOptionFromProduct(pairs)

    return new StepResponse(void 0, pairs)
  },
  async (pairs: RemoveProductOptionsFromProductStepInput | void, { container }) => {
    if (!pairs?.length) {
      return
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.addProductOptionToProduct(pairs)
  }
)
