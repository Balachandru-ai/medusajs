import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * The data to remove product option associations.
 */
export type RemoveProductOptionAssociationsStepInput = {
  productIds: string[]
  optionIds: string[]
}

export const removeProductOptionAssociationsStepId =
  "remove-product-option-associations"
/**
 * This step removes associations between products and product options.
 */
export const removeProductOptionAssociationsStep = createStep(
  removeProductOptionAssociationsStepId,
  async (input: RemoveProductOptionAssociationsStepInput, { container }) => {
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    if (!input.optionIds.length || !input.productIds.length) {
      return new StepResponse(void 0, void 0)
    }

    const pairs = input.productIds.flatMap((productId) =>
      input.optionIds.map((optionId) => ({
        product_id: productId,
        product_option_id: optionId,
      }))
    )

    await service.removeProductOptionFromProduct(pairs)

    return new StepResponse(void 0, pairs)
  },
  async (prevData, { container }) => {
    if (!prevData) {
      return
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.addProductOptionToProduct(prevData)
  }
)
