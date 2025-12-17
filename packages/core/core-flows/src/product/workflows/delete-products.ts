import { Modules, ProductWorkflowEvents } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  removeRemoteLinkStep,
  useQueryGraphStep,
} from "../../common"
import { deleteInventoryItemWorkflow } from "../../inventory"
import { deleteProductsStep } from "../steps/delete-products"
import { removeProductOptionAssociationsStep } from "../steps/remove-product-option-associations"
import { deleteProductOptionsWorkflow } from "./delete-product-options"

/**
 * The data to delete one or more products.
 */
export type DeleteProductsWorkflowInput = {
  /**
   * The IDs of the products to delete.
   */
  ids: string[]
}

export const deleteProductsWorkflowId = "delete-products"
/**
 * This workflow deletes one or more products. It's used by the
 * [Delete Products Admin API Route](https://docs.medusajs.com/api/admin#products_deleteproductsid).
 *
 * This workflow has a hook that allows you to perform custom actions after the products are deleted. For example,
 * you can delete custom records linked to the products.
 *
 * You can also use this workflow within your own custom workflows, allowing you to wrap custom logic around product deletion.
 *
 * @example
 * const { result } = await deleteProductsWorkflow(container)
 * .run({
 *   input: {
 *     ids: ["product_123"],
 *   }
 * })
 *
 * @summary
 *
 * Delete one or more products.
 *
 * @property hooks.productsDeleted - This hook is executed after the products are deleted. You can consume this hook to perform custom actions on the deleted products.
 */
export const deleteProductsWorkflow = createWorkflow(
  deleteProductsWorkflowId,
  (input: WorkflowData<DeleteProductsWorkflowInput>) => {
    const productsToDeleteResponse = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "variants.id",
        "variants.manage_inventory",
        "variants.inventory.id",
        "variants.inventory.variants.id",
        "options.id",
        "options.is_exclusive",
      ],
      filters: {
        id: input.ids,
      },
    }).config({ name: "query-products-with-options-step" })

    const productsToDelete = transform({ productsToDeleteResponse }, (data) => {
      return data.productsToDeleteResponse.data
    })

    const exclusiveOptionsToDelete = transform(
      { products: productsToDelete },
      (data) => {
        const products = data.products || []
        const exclusiveOptionIds = new Set<string>()

        products.forEach((product) => {
          const productOptions = product.options || []
          productOptions.forEach((option) => {
            if (option.is_exclusive) {
              exclusiveOptionIds.add(option.id)
            }
          })
        })

        return Array.from(exclusiveOptionIds)
      }
    )

    const variantsToBeDeleted = transform({ productsToDelete }, (data) => {
      return data.productsToDelete
        .flatMap((product) => product.variants)
        .map((variant) => variant.id)
    })

    const toDeleteInventoryItemIds = transform(
      { variants: variantsToBeDeleted },
      (data) => {
        return data.variants
          .filter((variant) => variant.manage_inventory)
          .flatMap((variant) =>
            variant.inventory.map((inventoryItem) => inventoryItem.id)
          )
      }
    )

    deleteInventoryItemWorkflow.runAsStep({
      input: toDeleteInventoryItemIds,
    })

    const [, deletedProduct] = parallelize(
      removeRemoteLinkStep({
        [Modules.PRODUCT]: {
          variant_id: variantsToBeDeleted,
          product_id: input.ids,
        },
      }).config({ name: "remove-product-variant-link-step" }),
      deleteProductsStep(input.ids)
    )

    // removeProductOptionAssociationsStep({
    //   productIds: input.ids,
    //   optionIds: exclusiveOptionsToDelete,
    // })

    deleteProductOptionsWorkflow.runAsStep({
      input: {
        ids: exclusiveOptionsToDelete,
      },
    })

    const productIdEvents = transform({ input }, ({ input }) => {
      return input.ids?.map((id) => {
        return { id }
      })
    })

    emitEventStep({
      eventName: ProductWorkflowEvents.DELETED,
      data: productIdEvents,
    })

    const productsDeleted = createHook("productsDeleted", {
      ids: input.ids,
    })

    return new WorkflowResponse(deletedProduct, {
      hooks: [productsDeleted],
    })
  }
)
