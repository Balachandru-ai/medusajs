import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The input for updating cart metadata with tax provider sourceMetadata.
 */
export interface UpdateCartTaxMetadataStepInput {
  /**
   * The cart's ID.
   */
  cart_id: string
  /**
   * The sourceMetadata returned by the tax provider to merge into the cart's metadata.
   */
  sourceMetadata: Record<string, unknown>
}

export const updateCartTaxMetadataStepId = "update-cart-tax-metadata"
/**
 * This step updates a cart's metadata by merging in sourceMetadata from a tax provider.
 * It fetches the current cart metadata from the database before merging to prevent
 * data loss when the cart object passed to the workflow doesn't include metadata.
 *
 * @example
 * updateCartTaxMetadataStep({
 *   cart_id: "cart_123",
 *   sourceMetadata: {
 *     taxjar_calculation_id: "calc_123"
 *   }
 * })
 */
export const updateCartTaxMetadataStep = createStep(
  updateCartTaxMetadataStepId,
  async (input: UpdateCartTaxMetadataStepInput, { container }) => {
    const cartModule = container.resolve<ICartModuleService>(Modules.CART)

    // Fetch current cart metadata from DB to avoid losing existing metadata
    const [cart] = await cartModule.listCarts(
      { id: input.cart_id },
      { select: ["id", "metadata"] }
    )

    if (!cart) {
      throw new Error(`Cart with id ${input.cart_id} not found`)
    }

    const previousMetadata = cart.metadata

    const updatedCart = await cartModule.updateCarts({
      id: input.cart_id,
      metadata: {
        ...(previousMetadata || {}),
        ...input.sourceMetadata,
      },
    })

    return new StepResponse(updatedCart, {
      cart_id: input.cart_id,
      previousMetadata,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const cartModule = container.resolve<ICartModuleService>(Modules.CART)

    // Restore previous metadata
    await cartModule.updateCarts({
      id: compensationData.cart_id,
      metadata: compensationData.previousMetadata ?? null,
    })
  }
)
