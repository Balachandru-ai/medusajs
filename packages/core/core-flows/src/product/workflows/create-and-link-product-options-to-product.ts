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
  add?: (
    | string
    | { id: string; value_ids: string[] }
    | ProductTypes.CreateProductOptionDTO
  )[]
  /**
   * The product options to remove from the product.
   */
  remove?: string[]
}

export const createAndLinkProductOptionsToProductWorkflowId =
  "create-and-link-product-options-to-product"
/**
 * This workflow adds/removes one or more product options to/from a product. It's used by the [TODO](TODO).
 * This workflow also creates non-existing product options before adding them to the product.
 *
 * You can also use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around product-option and product association.
 *
 * @example
 * const { result } = await createAndLinkProductOptionsToProductWorkflow(container)
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
export const createAndLinkProductOptionsToProductWorkflow = createWorkflow(
  createAndLinkProductOptionsToProductWorkflowId,
  (input: WorkflowData<LinkProductOptionsToProductWorkflowInput>) => {
    const { toCreate, toAdd, toAddWithValues } = transform(
      { input },
      ({ input }) => {
        const toCreate: ProductTypes.CreateProductOptionDTO[] = []
        const toAdd: string[] = []
        const toAddWithValues: Array<{
          option_id: string
          value_ids?: string[]
        }> = []

        for (const option of input.add ?? []) {
          if (isString(option)) {
            toAdd.push(option)
          } else if ("id" in option && "value_ids" in option) {
            toAddWithValues.push({
              option_id: option.id,
              value_ids: option.value_ids,
            })
          } else {
            toCreate.push(option as ProductTypes.CreateProductOptionDTO)
          }
        }

        return { toCreate, toAdd, toAddWithValues }
      }
    )

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

    const toAddOptions = transform(
      { toAdd, toAddWithValues, createdIds },
      ({ toAdd, toAddWithValues, createdIds }) => {
        const options: (
          | string
          | { product_option_id: string; product_option_value_ids?: string[] }
        )[] = []

        // Add simple option IDs (no value filtering)
        for (const optionId of toAdd) {
          options.push(optionId)
        }

        // Add options with specific values
        for (const { option_id, value_ids } of toAddWithValues) {
          options.push({
            product_option_id: option_id,
            product_option_value_ids: value_ids,
          })
        }

        // Add created options (no value filtering)
        for (const optionId of createdIds ?? []) {
          options.push(optionId)
        }

        return options
      }
    )

    const productOptions = linkProductOptionsToProductStep({
      product_id: input.product_id,
      add: toAddOptions,
      remove: input.remove,
    })

    return new WorkflowResponse(productOptions)
  }
)
