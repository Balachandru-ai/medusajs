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
    const knex = manager.getKnex()

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

    const variantMap = new Map(variants.map((v) => [v.id, v.product_id]))

    const allProductImages = await knex
      .select("*")
      .from("image")
      .whereIn("product_id", Array.from(variantMap.values()))

    const variantImagesPairs = await knex
      .select("image_id", "variant_id")
      .from("product_variant_product_image")
      .whereIn("variant_id", variantIdArray)

    const imageToVariantMap = new Map(
      variantImagesPairs.map((v) => [v.image_id, v.variant_id])
    )

    const variantToImagesMap = new Map(
      variantImagesPairs.map((v) => [v.variant_id, v.image_id])
    )

    // Group images by variant ID
    const result = new Map<string, InferEntityType<typeof ProductImage>[]>()

    for (const variantId of variantIdArray) {
      const variantImages = allProductImages.filter((img) => {
        return (
          !imageToVariantMap.has(img.id) || variantToImagesMap.has(variantId)
        )
      })

      result.set(variantId, variantImages)
    }

    return result
  }
}
