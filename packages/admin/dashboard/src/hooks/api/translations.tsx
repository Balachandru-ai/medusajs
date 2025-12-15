import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { queryClient } from "../../lib/query-client"
import { productsQueryKeys, useInfiniteProducts, useProducts } from "./products"
import {
  productVariantQueryKeys,
  useInfiniteVariants,
  useVariants,
} from "./product-variants"
import {
  categoriesQueryKeys,
  useInfiniteCategories,
  useProductCategories,
} from "./categories"
import {
  collectionsQueryKeys,
  useCollections,
  useInfiniteCollections,
} from "./collections"
import {
  productTagsQueryKeys,
  useInfiniteProductTags,
  useProductTags,
} from "./tags"
import {
  productTypesQueryKeys,
  useInfiniteProductTypes,
  useProductTypes,
} from "./product-types"

const TRANSLATIONS_QUERY_KEY = "translations" as const
export const translationsQueryKeys = queryKeysFactory(TRANSLATIONS_QUERY_KEY)

export const useReferenceTranslations = (
  reference: string,
  referenceId?: string | string[],
  options?: Omit<
    UseInfiniteQueryOptions<any, FetchError, any, any, QueryKey, number>,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  const referenceHookMap = new Map<
    string,
    () => Omit<UseInfiniteQueryResult<any, FetchError>, "data"> & {
      data: {
        translations: HttpTypes.AdminTranslation[]
        references: (Record<string, any> & { id: string })[]
        translatableFields: string[]
        count: number
      }
    }
  >([
    [
      "product",
      () => {
        const translatableFields = ["title", "description"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { data, ...rest } = useInfiniteProducts(
          { fields, id: referenceId ?? [] },
          options
        )
        const products = data?.pages.flatMap((page) => page.products) ?? []

        return {
          ...rest,
          data: {
            translations:
              products?.flatMap((product) => product.translations ?? []) ?? [],
            references: products ?? [],
            translatableFields,
            count: data?.pages[0]?.count ?? 0,
          },
        }
      },
    ],
    [
      "product_variant",
      () => {
        const translatableFields = ["title"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { data, ...rest } = useInfiniteVariants(
          { id: referenceId ?? [], fields },
          options
        )
        const variants = data?.pages.flatMap((page) => page.variants) ?? []

        return {
          ...rest,
          data: {
            translations:
              variants?.flatMap((variant) => variant.translations ?? []) ?? [],
            references: variants ?? [],
            translatableFields,
            count: data?.pages[0]?.count ?? 0,
          },
        }
      },
    ],
    [
      "product_category",
      () => {
        const translatableFields = ["name", "description"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { data, ...rest } = useInfiniteCategories(
          { id: referenceId ?? [], fields },
          options
        )
        const categories =
          data?.pages.flatMap((page) => page.product_categories) ?? []

        return {
          ...rest,
          data: {
            translations:
              categories?.flatMap((category) => category.translations ?? []) ??
              [],
            references: categories ?? [],
            translatableFields,
            count: data?.pages[0]?.count ?? 0,
          },
        }
      },
    ],
    [
      "product_collection",
      () => {
        const translatableFields = ["title"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { data, ...rest } = useInfiniteCollections(
          { id: referenceId ?? [], fields },
          options
        )
        const collections =
          data?.pages.flatMap((page) => page.collections) ?? []

        return {
          ...rest,
          data: {
            translations:
              collections?.flatMap(
                (collection) => collection.translations ?? []
              ) ?? [],
            references: collections ?? [],
            translatableFields,
            count: data?.pages[0]?.count ?? 0,
          },
        }
      },
    ],
    [
      "product_type",
      () => {
        const translatableFields = ["value"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { data, ...rest } = useInfiniteProductTypes(
          { id: referenceId ?? [], fields },
          options
        )
        const product_types =
          data?.pages.flatMap((page) => page.product_types) ?? []

        return {
          ...rest,
          data: {
            translations:
              product_types?.flatMap((type) => type.translations ?? []) ?? [],
            references: product_types ?? [],
            count: data?.pages[0]?.count ?? 0,
            translatableFields,
          },
        }
      },
    ],
    [
      "product_tag",
      () => {
        const translatableFields = ["value"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { data, ...rest } = useInfiniteProductTags(
          { id: referenceId ?? [], fields },
          options
        )
        const product_tags =
          data?.pages.flatMap((page) => page.product_tags) ?? []

        return {
          ...rest,
          data: {
            translations:
              product_tags?.flatMap((tag) => tag.translations ?? []) ?? [],
            references: product_tags ?? [],
            translatableFields,
            count: data?.pages[0]?.count ?? 0,
          },
        }
      },
    ],
    // TODO: product option and option values
  ])
  const referenceHook = referenceHookMap.get(reference)
  if (!referenceHook) {
    throw new Error(`No hook found for reference type: ${reference}`)
  }
  const { data, ...rest } = referenceHook()
  return { ...data, ...rest }
}

export const useTranslations = (
  query?: HttpTypes.AdminTranslationsListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminTranslationsListResponse,
      FetchError,
      HttpTypes.AdminTranslationsListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: translationsQueryKeys.list(query),
    queryFn: () => sdk.admin.translation.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useBatchTranslations = (
  reference: string,
  options?: UseMutationOptions<
    HttpTypes.AdminTranslationsBatchResponse,
    FetchError,
    HttpTypes.AdminBatchTranslations
  >
) => {
  const referenceInvalidationKeysMap = new Map<string, QueryKey>([
    ["product", productsQueryKeys.lists()],
    ["product_variant", productVariantQueryKeys.lists()],
    ["product_category", categoriesQueryKeys.lists()],
    ["product_collection", collectionsQueryKeys.lists()],
    ["product_type", productTypesQueryKeys.lists()],
    ["product_tag", productTagsQueryKeys.lists()],
  ])

  return useMutation({
    mutationFn: (payload: HttpTypes.AdminBatchTranslations) =>
      sdk.admin.translation.batch(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: referenceInvalidationKeysMap.get(reference),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
