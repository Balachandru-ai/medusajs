import { ProductImage } from "@models"
import { Context, InferEntityType } from "@medusajs/framework/types"
import { DALUtils } from "@medusajs/framework/utils"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"

export class ProductImageRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  ProductImage
) {
  constructor(...args: any[]) {
    // @ts-ignore
    super(...arguments)
  }

  /**
   * Fetches variant images for one or more variant IDs.
   * Returns a map of variant ID to images for each variant.
   * Variant images contain variant scoped images + general product images
   */
  async getVariantImages(
    variantIds: string | string[],
    context: Context = {}
  ): Promise<Map<string, InferEntityType<typeof ProductImage>[]>> {
    const manager = this.getActiveManager<SqlEntityManager>(context)

    const variantIdArray = Array.isArray(variantIds) ? variantIds : [variantIds]

    if (variantIdArray.length === 0) {
      return new Map()
    }

    // First, get all variants to find their product_ids
    const variants = await manager.find(
      "ProductVariant",
      { id: variantIdArray },
      { fields: ["id", "product_id"] }
    )

    if (variants.length === 0) {
      return new Map()
    }

    const variantProductIdMap = new Map(
      variants.map((v) => [v.id, v.product_id])
    )

    const allProductImages = await manager.find(
      "ProductImage",
      { product_id: Array.from(variantProductIdMap.values()) },
      {
        fields: [
          "id",
          "url",
          "metadata",
          "rank",
          "product_id",
          "created_at",
          "updated_at",
          "deleted_at",
        ],
        populate: ["variants"],
      }
    )

    // Group images by variant ID
    const result = new Map<string, InferEntityType<typeof ProductImage>[]>()

    for (const variantId of variantIdArray) {
      const productId = variantProductIdMap.get(variantId)
      const variantImages = allProductImages.filter((img) => {
        // belongs to another product
        if (img.product_id !== productId) {
          return false
        }

        if (!img.variants.count()) {
          return true
        }

        return img.variants.exists((v) => v.id === variantId)
      })

      result.set(
        variantId,
        variantImages as InferEntityType<typeof ProductImage>[]
      )
    }

    return result
  }
}
