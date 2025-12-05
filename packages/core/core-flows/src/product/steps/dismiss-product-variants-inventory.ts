import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export const dismissProductVariantsInventoryStepId =
  "dismiss-product-variants-inventory"

export type DismissProductVariantsInventoryStepInput = {
  variantIds: string[]
}

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

export const dismissProductVariantsInventoryStep = createStep(
  dismissProductVariantsInventoryStepId,
  async (data: DismissProductVariantsInventoryStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const variantIds = data.variantIds || []

    if (!variantIds.length) {
      return new StepResponse(void 0)
    }

    const dismissedVariantInventoryItems = await dismissVariantsInventory(
      variantIds,
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
