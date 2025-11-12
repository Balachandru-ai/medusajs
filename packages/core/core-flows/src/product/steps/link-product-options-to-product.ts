import { IProductModuleService, ProductTypes } from "@medusajs/framework/types"
import { Modules, promiseAll } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * The data to add/remove one or more product options to/from a product.
 */
export type LinkProductOptionsToProductStepInput = {
  /**
   * The product ID to add/remove the options to/from.
   */
  product_id: string
  /**
   * The product options to add to the product.
   */
  add?: (string | Omit<ProductTypes.ProductOptionProductPair, "product_id">)[]
  /**
   * The product options to remove from the product.
   */
  remove?: string[]
}

export const linkProductOptionsToProductStepId =
  "link-product-options-to-product"
/**
 * This step adds/removes one or more product options to/from a product.
 *
 * @example
 * const data = linkProductOptionsToProductStep({
 *   product_id: "prod_123",
 *   product_option_ids: ["opt_123", "opt_321"]
 * })
 */
export const linkProductOptionsToProductStep = createStep(
  linkProductOptionsToProductStepId,
  async (input: LinkProductOptionsToProductStepInput, { container }) => {
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    const toAdd = (input.add ?? []).map((option) => {
      if (typeof option === "string") {
        return {
          product_option_id: option,
          product_id: input.product_id,
        }
      }
      return {
        product_option_id: option.product_option_id,
        product_id: input.product_id,
        product_option_value_ids: option.product_option_value_ids,
      }
    })

    const toRemove = (input.remove ?? []).map((optionId) => {
      return {
        product_option_id: optionId,
        product_id: input.product_id,
      }
    })

    const promises: Promise<any>[] = []
    if (toAdd.length) {
      promises.push(service.addProductOptionToProduct(toAdd))
    }
    if (toRemove.length) {
      promises.push(service.removeProductOptionFromProduct(toRemove))
    }
    await promiseAll(promises)

    return new StepResponse(void 0, { toAdd, toRemove })
  },
  async (prevData, { container }) => {
    if (!prevData) {
      return
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    if (prevData.toAdd.length) {
      await service.removeProductOptionFromProduct(prevData.toAdd)
    }
    if (prevData.toRemove.length) {
      await service.addProductOptionToProduct(prevData.toRemove)
    }
  }
)
