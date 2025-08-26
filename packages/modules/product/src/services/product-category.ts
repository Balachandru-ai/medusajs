import {
  Context,
  DAL,
  FindConfig,
  InferEntityType,
  ProductTypes,
} from "@medusajs/framework/types"
import {
  FreeTextSearchFilterKeyPrefix,
  InjectManager,
  isDefined,
  MedusaContext,
  MedusaError,
  MedusaInternalService,
  ModulesSdkUtils,
} from "@medusajs/framework/utils"
import { ProductCategory } from "@models"

type InjectedDependencies = {
  productCategoryRepository: DAL.TreeRepositoryService
}
export default class ProductCategoryService extends MedusaInternalService<
  InjectedDependencies,
  typeof ProductCategory
>(ProductCategory) {
  protected readonly productCategoryRepository_: DAL.TreeRepositoryService

  constructor({ productCategoryRepository }: InjectedDependencies) {
    // @ts-expect-error
    super(...arguments)
    this.productCategoryRepository_ = productCategoryRepository
  }

  // TODO: Add support for object filter
  @InjectManager("productCategoryRepository_")
  // @ts-expect-error
  async retrieve(
    productCategoryId: string,
    config: FindConfig<ProductTypes.ProductCategoryDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof ProductCategory>> {
    if (!isDefined(productCategoryId)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `"productCategoryId" must be defined`
      )
    }

    const queryOptions = ModulesSdkUtils.buildQuery(
      {
        id: productCategoryId,
      },
      config
    )

    // TODO: Currently remoteQuery doesn't allow passing custom objects, so the `include*` are part of the filters
    // Modify remoteQuery to allow passing custom objects
    const transformOptions = {
      includeDescendantsTree: true,
    }

    const productCategories = await this.productCategoryRepository_.find(
      queryOptions,
      transformOptions,
      sharedContext
    )

    if (!productCategories?.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ProductCategory with id: ${productCategoryId} was not found`
      )
    }

    return productCategories[0]
  }

  @InjectManager("productCategoryRepository_")
  async list(
    filters: ProductTypes.FilterableProductCategoryProps = {},
    config: FindConfig<ProductTypes.ProductCategoryDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof ProductCategory>[]> {
    const transformOptions = {
      includeDescendantsTree: filters?.include_descendants_tree || false,
      includeAncestorsTree: filters?.include_ancestors_tree || false,
    }
    delete filters.include_descendants_tree
    delete filters.include_ancestors_tree

    // Apply free text search filter
    if (isDefined(filters?.q)) {
      config.filters ??= {}
      config.filters[FreeTextSearchFilterKeyPrefix + ProductCategory.name] = {
        value: filters.q,
        fromEntity: ProductCategory.name,
      }

      delete filters.q
    }

    const queryOptions = ModulesSdkUtils.buildQuery(filters, config)
    queryOptions.where ??= {}

    return await this.productCategoryRepository_.find(
      queryOptions,
      transformOptions,
      sharedContext
    )
  }

  @InjectManager("productCategoryRepository_")
  async listAndCount(
    filters: ProductTypes.FilterableProductCategoryProps = {},
    config: FindConfig<ProductTypes.ProductCategoryDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<[InferEntityType<typeof ProductCategory>[], number]> {
    const transformOptions = {
      includeDescendantsTree: filters?.include_descendants_tree || false,
      includeAncestorsTree: filters?.include_ancestors_tree || false,
    }
    delete filters.include_descendants_tree
    delete filters.include_ancestors_tree

    // Apply free text search filter
    if (isDefined(filters?.q)) {
      config.filters ??= {}
      config.filters[FreeTextSearchFilterKeyPrefix + ProductCategory.name] = {
        value: filters.q,
        fromEntity: ProductCategory.name,
      }

      delete filters.q
    }

    const queryOptions = ModulesSdkUtils.buildQuery(filters, config)
    queryOptions.where ??= {}

    return await this.productCategoryRepository_.findAndCount(
      queryOptions,
      transformOptions,
      sharedContext
    )
  }
}
