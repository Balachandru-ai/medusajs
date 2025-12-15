import { Product, ProductOption } from "@models"

import { Context, DAL, InferEntityType } from "@medusajs/framework/types"
import {
  arrayDifference,
  DALUtils,
  deepCopy,
  isDefined,
  isPresent,
  MedusaError,
  mergeMetadata,
} from "@medusajs/framework/utils"
import {
  SqlEntityManager,
  wrap,
} from "@medusajs/framework/mikro-orm/postgresql"

export class ProductRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  Product
) {
  constructor(...args: any[]) {
    // @ts-ignore
    super(...arguments)
  }

  /**
   * Identify the relations to load for the given update.
   * @param update
   * @returns
   */
  static #getProductDeepUpdateRelationsToLoad(
    productsToUpdate: any[]
  ): string[] {
    const relationsToLoad = new Set<string>()
    productsToUpdate.forEach((productToUpdate) => {
      if (productToUpdate.options) {
        relationsToLoad.add("options")
        relationsToLoad.add("options.values")
      }
      if (productToUpdate.variants) {
        relationsToLoad.add("options")
        relationsToLoad.add("options.values")
        relationsToLoad.add("variants")
        relationsToLoad.add("variants.options")
        relationsToLoad.add("variants.options.option")
      }
      if (productToUpdate.tags) relationsToLoad.add("tags")
      if (productToUpdate.categories) relationsToLoad.add("categories")
      if (productToUpdate.images) relationsToLoad.add("images")
      if (productToUpdate.collection) relationsToLoad.add("collection")
      if (productToUpdate.type) relationsToLoad.add("type")
    })
    return Array.from(relationsToLoad)
  }

  // We should probably fix the column types in the database to avoid this
  // It would also match the types in ProductVariant, which are already numbers
  static #correctUpdateDTOTypes(productToUpdate: {
    weight?: string | number
    length?: string | number
    height?: string | number
    width?: string | number
  }) {
    if (isDefined(productToUpdate.weight)) {
      productToUpdate.weight = productToUpdate.weight?.toString()
    }
    if (isDefined(productToUpdate.length)) {
      productToUpdate.length = productToUpdate.length?.toString()
    }
    if (isDefined(productToUpdate.height)) {
      productToUpdate.height = productToUpdate.height?.toString()
    }
    if (isDefined(productToUpdate.width)) {
      productToUpdate.width = productToUpdate.width?.toString()
    }
  }

  async deepUpdate(
    productsToUpdate: ({ id: string } & any)[],
    validateVariantOptions: (
      variants: any[],
      options: InferEntityType<typeof ProductOption>[]
    ) => void,
    expectedOptionIdsMap: Map<string, Set<string>> = new Map(),
    context: Context = {}
  ): Promise<InferEntityType<typeof Product>[]> {
    const productsToUpdate_ = deepCopy(productsToUpdate)
    const productIdsToUpdate: string[] = []

    productsToUpdate_.forEach((productToUpdate) => {
      ProductRepository.#correctUpdateDTOTypes(productToUpdate)
      productIdsToUpdate.push(productToUpdate.id)
    })

    const relationsToLoad =
      ProductRepository.#getProductDeepUpdateRelationsToLoad(productsToUpdate_)

    const manager = super.getActiveManager<SqlEntityManager>(context)
    const products = await manager.find<InferEntityType<typeof Product>>(
      Product.name,
      { id: productIdsToUpdate },
      { populate: relationsToLoad, limit: productsToUpdate_.length } as any
    )
    const productsMap = new Map(products.map((p) => [p.id, p]))

    const productIds = Array.from(productsMap.keys())
    const productsNotFound = arrayDifference(productIdsToUpdate, productIds)

    if (productsNotFound.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Unable to update the products with ids: ${productsNotFound.join(", ")}`
      )
    }

    for (const productToUpdate of productsToUpdate_) {
      const product = productsMap.get(productToUpdate.id)!
      const wrappedProduct = wrap(product)

      if (productToUpdate.options) {
        wrappedProduct.assign({ options: productToUpdate.options })
        delete productToUpdate.options
      }

      if (productToUpdate.variants) {
        const expectedOptionIds = expectedOptionIdsMap.get(product.id)
        const optionsForValidation = expectedOptionIds
          ? product.options.filter((o) => expectedOptionIds.has(o.id))
          : product.options

        validateVariantOptions(productToUpdate.variants, optionsForValidation)

        productToUpdate.variants.forEach((variant: any) => {
          if (variant.options) {
            variant.options = Object.entries(variant.options).map(
              ([key, value]) => {
                const productOption = product.options.find(
                  (option) => option.title === key
                )!
                const productOptionValue = productOption.values?.find(
                  (optionValue) => optionValue.value === value
                )!
                return productOptionValue.id
              }
            )
          }
        })
      }

      if (productToUpdate.tags) {
        productToUpdate.tags = productToUpdate.tags.map(
          (t: { id: string }) => t.id
        )
      }
      if (productToUpdate.categories) {
        productToUpdate.categories = productToUpdate.categories.map(
          (c: { id: string }) => c.id
        )
      }
      if (productToUpdate.images) {
        productToUpdate.images = productToUpdate.images.map(
          (image: any, index: number) => ({
            ...image,
            rank: index,
          })
        )
      }

      if (isPresent(productToUpdate.metadata)) {
        productToUpdate.metadata = mergeMetadata(
          product.metadata ?? {},
          productToUpdate.metadata
        )
      }

      wrappedProduct.assign(productToUpdate)
    }

    // Doing this to ensure updates are returned in the same order they were provided,
    // since some core flows rely on this.
    // This is a high level of coupling though.
    return productsToUpdate_.map(
      (productToUpdate) => productsMap.get(productToUpdate.id)!
    )
  }

  /**
   * In order to be able to have a strict not in categories, and prevent a product
   * to be return in the case it also belongs to other categories, we need to
   * first find all products that are in the categories, and then exclude them
   */
  protected async mutateNotInCategoriesConstraints(
    findOptions: DAL.FindOptions<typeof Product> = {
      where: {},
    },
    context: Context = {}
  ): Promise<void> {
    const manager = this.getActiveManager<SqlEntityManager>(context)

    if (
      "categories" in findOptions.where &&
      findOptions.where.categories?.id?.["$nin"]
    ) {
      const productsInCategories = await manager.find(
        this.entity,
        {
          categories: {
            id: { $in: findOptions.where.categories.id["$nin"] },
          },
        },
        {
          fields: ["id"],
        }
      )

      const productIds = productsInCategories.map((product) => product.id)

      if (productIds.length) {
        findOptions.where.id = { $nin: productIds }
        delete findOptions.where.categories?.id

        if (Object.keys(findOptions.where.categories).length === 0) {
          delete findOptions.where.categories
        }
      }
    }
  }

  /**
   * Checks if any variants of products use the specified option values.
   * Queries the product_variant_option pivot table directly in bulk.
   *
   * @param pairs - Array of { productId, optionValueIds } pairs to check
   * @param context - The context
   * @returns Map keyed by `${productId}_${valueId}` with arrays of variant info (id and title) that use those values
   */
  async checkVariantsUsingOptionValues(
    pairs: Array<{ productId: string; optionValueIds: string[] }>,
    context: Context = {}
  ): Promise<
    Map<
      string,
      Array<{ variant_id: string; title: string | null; product_id: string }>
    >
  > {
    if (pairs.length === 0) {
      return new Map()
    }

    // Filter out pairs with empty value arrays
    const validPairs = pairs.filter((p) => p.optionValueIds.length > 0)
    if (validPairs.length === 0) {
      return new Map()
    }

    const manager = this.getActiveManager<SqlEntityManager>(context)
    const connection = manager.getConnection()
    const knex = connection.getKnex()

    // Collect all unique product IDs and value IDs
    const allProductIds = [...new Set(validPairs.map((p) => p.productId))]
    const allValueIds = [
      ...new Set(validPairs.flatMap((p) => p.optionValueIds)),
    ]

    const result = await knex
      .select(
        "pvo.variant_id",
        "pv.title",
        "pv.product_id",
        "pvo.option_value_id"
      )
      .distinct()
      .from("product_variant_option as pvo")
      .innerJoin("product_variant as pv", "pv.id", "pvo.variant_id")
      .whereIn("pv.product_id", allProductIds)
      .whereNull("pv.deleted_at")
      .whereIn("pvo.option_value_id", allValueIds)

    // Group results by product_id and option_value_id
    const resultMap = new Map<
      string,
      Array<{ variant_id: string; title: string | null; product_id: string }>
    >()

    for (const row of result) {
      const key = `${row.product_id}_${row.option_value_id}`
      if (!resultMap.has(key)) {
        resultMap.set(key, [])
      }
      resultMap.get(key)!.push({
        variant_id: row.variant_id,
        title: row.title,
        product_id: row.product_id,
      })
    }

    return resultMap
  }
}
