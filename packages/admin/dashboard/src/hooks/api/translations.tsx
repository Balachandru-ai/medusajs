import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { queryClient } from "../../lib/query-client"
import { productsQueryKeys, useProducts } from "./products"
import { productVariantQueryKeys, useVariants } from "./product-variants"
import { categoriesQueryKeys, useProductCategories } from "./categories"
import { collectionsQueryKeys, useCollections } from "./collections"
import { productTagsQueryKeys, useProductTags } from "./tags"
import { productTypesQueryKeys, useProductTypes } from "./product-types"

const TRANSLATIONS_QUERY_KEY = "translations" as const
export const translationsQueryKeys = queryKeysFactory(TRANSLATIONS_QUERY_KEY)

export const useReferenceTranslations = (
  reference: string,
  referenceId?: string | string[],
  options?: Omit<
    UseQueryOptions<any, FetchError, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const referenceHookMap = new Map<
    string,
    () => UseQueryResult<{
      translations: HttpTypes.AdminTranslation[]
      references: { id: string; [key: string]: string }[]
      translatableFields: string[]
    }>
  >([
    [
      "product",
      () => {
        const translatableFields = ["title", "description"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { products, ...rest } = useProducts(
          { id: referenceId ?? [], fields },
          options
        )
        return {
          ...rest,
          data: {
            translations:
              products?.flatMap((product) => product.translations ?? []) ?? [],
            references: products ?? [],
            translatableFields,
          },
        } as unknown as UseQueryResult<{
          translations: HttpTypes.AdminTranslation[]
          references: { id: string; [key: string]: string }[]
          translatableFields: string[]
        }>
      },
    ],
    [
      "product_variant",
      () => {
        const translatableFields = ["title"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { variants, ...rest } = useVariants(
          { id: referenceId ?? [], fields },
          options
        )
        return {
          ...rest,
          data: {
            translations:
              variants?.flatMap((variant) => variant.translations ?? []) ?? [],
            references: variants ?? [],
            translatableFields,
          },
        } as unknown as UseQueryResult<{
          translations: HttpTypes.AdminTranslation[]
          references: { id: string; [key: string]: string }[]
          translatableFields: string[]
        }>
      },
    ],
    [
      "product_category",
      () => {
        const translatableFields = ["name", "description"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { product_categories, ...rest } = useProductCategories(
          { id: referenceId ?? [], fields },
          options
        )
        return {
          ...rest,
          data: {
            translations:
              product_categories?.flatMap(
                (category) => category.translations ?? []
              ) ?? [],
            references: product_categories ?? [],
            translatableFields,
          },
        } as unknown as UseQueryResult<{
          translations: HttpTypes.AdminTranslation[]
          references: { id: string; [key: string]: string }[]
          translatableFields: string[]
        }>
      },
    ],
    [
      "product_collection",
      () => {
        const translatableFields = ["title"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { collections, ...rest } = useCollections(
          { id: referenceId ?? [], fields },
          options
        )
        return {
          ...rest,
          data: {
            translations:
              collections?.flatMap(
                (collection) => collection.translations ?? []
              ) ?? [],
            references: collections ?? [],
            translatableFields,
          },
        } as unknown as UseQueryResult<{
          translations: HttpTypes.AdminTranslation[]
          references: { id: string; [key: string]: string }[]
          translatableFields: string[]
        }>
      },
    ],
    [
      "product_type",
      () => {
        const translatableFields = ["value"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { product_types, ...rest } = useProductTypes(
          { id: referenceId ?? [], fields },
          options
        )
        return {
          ...rest,
          data: {
            translations:
              product_types?.flatMap((type) => type.translations ?? []) ?? [],
            references: product_types ?? [],
            translatableFields,
          },
        } as unknown as UseQueryResult<{
          translations: HttpTypes.AdminTranslation[]
          references: { id: string; [key: string]: string }[]
          translatableFields: string[]
        }>
      },
    ],
    [
      "product_tag",
      () => {
        const translatableFields = ["value"]
        const fields = translatableFields.concat(["translations.*"]).join(",")

        const { product_tags, ...rest } = useProductTags(
          { id: referenceId ?? [], fields },
          options
        )
        return {
          ...rest,
          data: {
            translations:
              product_tags?.flatMap((tag) => tag.translations ?? []) ?? [],
            references: product_tags ?? [],
            translatableFields,
          },
        } as unknown as UseQueryResult<{
          translations: HttpTypes.AdminTranslation[]
          references: { id: string; [key: string]: string }[]
          translatableFields: string[]
        }>
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
