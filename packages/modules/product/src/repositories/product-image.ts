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
   * For each variant, returns all images for that variant and all images of that variant's product
   * that are not associated with other variants.
   */
  async getVariantImages(
    variantIds: string | string[],
    context: Context = {}
  ): Promise<Map<string, InferEntityType<typeof ProductImage>[]>> {
    const manager = this.getActiveManager<SqlEntityManager>(context)
    const knex = manager.getKnex()

    const variantIdArray = Array.isArray(variantIds) ? variantIds : [variantIds]

    if (variantIdArray.length === 0) {
      return new Map()
    }

    // First, get all variants to find their product_ids
    const variants = await manager.find(
      "ProductVariant",
      { id: { $in: variantIdArray } },
      { fields: ["id", "product_id"] }
    )

    if (variants.length === 0) {
      return new Map()
    }

    const variantMap = new Map(variants.map((v) => [v.id, v.product_id]))

    const query = knex
      .select({
        id: "image.id",
        url: "image.url",
        product_id: "image.product_id",
        variant_id: "product_variant_product_image.variant_id",
        rank: "image.rank",
        metadata: "image.metadata",
        created_at: "image.created_at",
        updated_at: "image.updated_at",
        deleted_at: "image.deleted_at",
      })
      .from("image")
      .rightJoin(
        "product_variant_product_image",
        "image.id",
        "product_variant_product_image.image_id"
      )
      .whereIn("product_variant_product_image.variant_id", variantIdArray)
      .orWhere((q) =>
        q
          .whereIn("image.product_id", Array.from(variantMap.values()))
          .andWhereRaw(
            "image.id NOT IN (SELECT image_id FROM product_variant_product_image WHERE variant_id IN (?))",
            [variantIdArray]
          )
      )

    const images = (await query) as InferEntityType<typeof ProductImage>[]

    console.log(query.toQuery(), images)

    // Group images by variant ID
    const result = new Map<string, InferEntityType<typeof ProductImage>[]>()

    for (const variantId of variantIdArray) {
      const productId = variantMap.get(variantId)
      if (!productId) {
        result.set(variantId, [])
        continue
      }

      const variantImages = images.filter((img) => {
        // Image belongs to this variant if:
        // 1. It's directly associated with this variant, OR
        // 2. It's a product image not associated with any other variant
        const isDirectlyAssociated = img.variants?.some(
          (v) => v.id === variantId
        )
        const isProductImageNotAssociatedWithOthers =
          img.product?.id === productId &&
          (!img.variants ||
            img.variants.length === 0 ||
            img.variants.every((v) => variantIdArray.includes(v.id)))

        return isDirectlyAssociated || isProductImageNotAssociatedWithOthers
      })

      result.set(variantId, variantImages)
    }

    return result
  }
}
