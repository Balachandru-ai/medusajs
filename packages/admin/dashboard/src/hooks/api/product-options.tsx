import { FetchError } from "@medusajs/js-sdk"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { HttpTypes } from "@medusajs/types"
import { queryClient } from "../../lib/query-client.ts"

const PRODUCT_OPTIONS_QUERY_KEY = "product_options" as const
export const productOptionsQueryKeys = queryKeysFactory(
  PRODUCT_OPTIONS_QUERY_KEY
)

export const useProductOption = (
  id: string,
  query?: HttpTypes.AdminProductOptionParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductOptionResponse,
      FetchError,
      HttpTypes.AdminProductOptionResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productOptionsQueryKeys.detail(id, query),
    queryFn: () => sdk.admin.productOption.retrieve(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductOptions = (
  query?: HttpTypes.AdminProductOptionListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductOptionListResponse,
      FetchError,
      HttpTypes.AdminProductOptionListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productOption.list(query),
    queryKey: productOptionsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useDeleteProductOption = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductOptionDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.productOption.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productOptionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productOptionsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductOptionLazy = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductOptionDeleteResponse,
    FetchError,
    string
  >
) => {
  return useMutation({
    mutationFn: (id: string) => sdk.admin.productOption.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productOptionsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productOptionsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
