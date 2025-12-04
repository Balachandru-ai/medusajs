import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { queryClient } from "../../lib/query-client"

const TRANSLATIONS_QUERY_KEY = "translations" as const
export const translationsQueryKeys = queryKeysFactory(TRANSLATIONS_QUERY_KEY)

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
  options?: UseMutationOptions<
    HttpTypes.AdminTranslationsBatchResponse,
    FetchError,
    HttpTypes.AdminBatchTranslations
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminBatchTranslations) =>
      sdk.admin.translation.batch(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: translationsQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
