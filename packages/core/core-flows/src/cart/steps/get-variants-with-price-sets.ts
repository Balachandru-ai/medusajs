import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * The details of the variants to get with their price sets.
 */
export interface GetVariantsWithPriceSetsStepInput {
  /**
   * The IDs of the variants to get with their price sets.
   */
  variantIds: string[]
}

/**
 * The variants with their price set IDs.
 */
export interface GetVariantsWithPriceSetsStepOutput {
  variants: Array<{
    id: string
    price_set_id: string
  }>
}

export const getVariantsWithPriceSetsStepId = "get-variants-with-price-sets"

/**
 * This step retrieves variants with their associated price set IDs without calculating prices.
 */
export const getVariantsWithPriceSetsStep = createStep(
  getVariantsWithPriceSetsStepId,
  async (data: GetVariantsWithPriceSetsStepInput, { container }) => {
    if (!data.variantIds.length) {
      return new StepResponse({ variants: [] })
    }

    const remoteQuery = container.resolve("remoteQuery")

    const variantPriceSets = await remoteQuery({
      entryPoint: "variant",
      fields: ["id", "price_set.id"],
      variables: {
        id: data.variantIds,
      },
    })

    const notFound: string[] = []
    const variants: Array<{ id: string; price_set_id: string }> = []

    variantPriceSets.forEach((v) => {
      if (v.price_set?.id) {
        variants.push({
          id: v.id,
          price_set_id: v.price_set.id,
        })
      } else {
        notFound.push(v.id)
      }
    })

    if (notFound.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Variants with IDs ${notFound.join(", ")} do not have a price`
      )
    }

    return new StepResponse({ variants })
  }
)