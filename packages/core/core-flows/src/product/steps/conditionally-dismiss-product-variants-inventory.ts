import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateProductWorkflowInput } from "../workflows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export const conditionallyDismissProductVariantsInventoryStepId =
  "conditionally-dismiss-product-variants-inventory"

async function dismissVariantsInventory(
  variantIds: string[],
  query: any,
  link: any
): Promise<Record<string, string[]>> {
  const dismissedVariantInventoryItems: Record<string, string[]> = {}

  for (const variantId of variantIds) {
    if (!variantId) {
      continue
    }

    const { data: variantInventoryItems } = await query.graph({
      entity: "product_variant_inventory_item",
      fields: ["inventory_item_id"],
      filters: {
        variant_id: variantIds,
      },
    })

    dismissedVariantInventoryItems[variantId] = variantInventoryItems.map(
      (item: { inventory_item_id: string }) => item.inventory_item_id
    )

    await Promise.all(
      variantInventoryItems.map(async (item: { inventory_item_id: string }) => {
        await link.dismiss({
          [Modules.PRODUCT]: { variant_id: variantId },
          [Modules.INVENTORY]: {
            inventory_item_id: item.inventory_item_id,
          },
        })
      })
    )
  }

  return dismissedVariantInventoryItems
}

export const conditionallyDismissProductVariantsInventoryStep = createStep(
  conditionallyDismissProductVariantsInventoryStepId,
  async (data: UpdateProductWorkflowInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    if ("products" in data) {
      if (!data.products.length) {
        return new StepResponse(void 0)
      }

      const unmanagedVariantIds: string[] = []
      for (const product of data.products) {
        if (!product.variants?.length) {
          continue
        }

        const unmanagedVariants = product.variants.filter(
          (variant) => variant.manage_inventory === false && variant.id
        )
        unmanagedVariantIds.push(
          ...unmanagedVariants.map((variant) => variant.id!)
        )
      }

      if (!unmanagedVariantIds.length) {
        return new StepResponse(void 0)
      }

      const dismissedVariantInventoryItems = await dismissVariantsInventory(
        unmanagedVariantIds,
        query,
        link
      )
      return new StepResponse(void 0, dismissedVariantInventoryItems)
    }

    const unmanagedVariants =
      data.update?.variants?.filter(
        (variant) => variant.manage_inventory === false && variant.id
      ) ?? []
    if (!unmanagedVariants.length) {
      return new StepResponse(void 0)
    }

    const dismissedVariantInventoryItems = await dismissVariantsInventory(
      unmanagedVariants.map((variant) => variant.id!),
      query,
      link
    )
    return new StepResponse(void 0, dismissedVariantInventoryItems)
  },
  async (dismissedVariantInventoryItems, { container }) => {
    if (!dismissedVariantInventoryItems) {
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    await Promise.all(
      Object.entries(dismissedVariantInventoryItems).map(
        async ([variantId, inventoryItemIds]) => {
          await link.create(
            inventoryItemIds.map((inventoryItemId) => ({
              [Modules.PRODUCT]: { variant_id: variantId },
              [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
            }))
          )
        }
      )
    )
  }
)
