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
import { isString } from "@medusajs/framework/utils"

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
    const { toCreate, toAdd } = transform({ input }, ({ input }) => {
      const toCreate: ProductTypes.CreateProductOptionDTO[] = []
      const toAdd: string[] = []
      for (const option of input.add ?? []) {
        isString(option) ? toAdd.push(option) : toCreate.push(option)
      }

      return { toCreate, toAdd }
    })

    const createdIds = when(
      "creating-product-options",
      { toCreate },
      ({ toCreate }) => toCreate.length > 0
    ).then(() => {
      const createdOptions = createProductOptionsStep(toCreate)
      return transform({ createdOptions }, ({ createdOptions }) =>
        createdOptions.map((option) => option.id)
      )
    })

    const toAddProductOptionIds = transform(
      { toAdd, createdIds },
      ({ toAdd, createdIds }) => toAdd.concat(createdIds ?? [])
    )

    const productOptions = linkProductOptionsToProductStep({
      product_id: input.product_id,
      add: toAddProductOptionIds,
      remove: input.remove,
    })

    return new WorkflowResponse(productOptions)
  }
)
