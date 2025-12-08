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
