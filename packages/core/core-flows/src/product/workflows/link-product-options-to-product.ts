import type { ProductTypes } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createProductOptionsStep,
  linkProductOptionsToProductStep,
} from "../steps"

/**
 * The data to add/remove one or more product options to/from a product.
 */
export type LinkProductOptionsToProductWorkflowInput = {
  /**
   * The product ID to add/remove the options to/from.
   */
  product_id: string
  /**
   * The product options to add to the product.
   */
  add?: (string | ProductTypes.CreateProductOptionDTO)[]
  /**
   * The product options to remove from the product.
   */
  remove?: string[]
}

export const linkProductOptionsToProductWorkflowId =
  "link-product-options-to-product"
/**
 * This workflow adds/removes one or more product options to/from a product. It's used by the [TODO](TODO).
 * This workflow also creates non-existing product options before adding them to the product.
 *
 * You can also use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around product-option and product association.
 *
 * @example
 * const { result } = await linkProductOptionsToProductWorkflow(container)
 * .run({
 *   input: {
 *     product_id: "prod_123"
 *     add: [
 *       {
 *         title: "Size",
 *         values: ["S", "M", "L", "XL"]
 *       },
 *       { id: "opt_123" }
 *     ],
 *     remove: ["opt_321"]
 *   }
 * })
 *
 * @summary
 *
 * Add/remove one or more product options to/from a product.
 */
export const linkProductOptionsToProductWorkflow = createWorkflow(
  linkProductOptionsToProductWorkflowId,
  (input: WorkflowData<LinkProductOptionsToProductWorkflowInput>) => {
    const optionsToCreate = transform({ input }, ({ input }) => {
      return (input.add ?? []).filter((option) => !(typeof option === "string"))
    }) as ProductTypes.CreateProductOptionDTO[]

    const createdIds = when(
      "creating-product-options",
      { optionsToCreate },
      ({ optionsToCreate }) => optionsToCreate.length > 0
    ).then(() => {
      const createdOptions = createProductOptionsStep(optionsToCreate)

      return transform({ createdOptions }, ({ createdOptions }) => {
        return createdOptions.map((option) => option.id)
      })
    })

    const toAddProductOptionIds = transform(
      { input, createdIds },
      ({ input, createdIds }) => {
        return (input.add ?? [])
          .filter((option) => typeof option === "string")
          .concat(createdIds ? createdIds : [])
      }
    )

    const productOptions = linkProductOptionsToProductStep({
      product_id: input.product_id,
      add: toAddProductOptionIds,
      remove: input.remove,
    })

    return new WorkflowResponse(productOptions)
  }
)
