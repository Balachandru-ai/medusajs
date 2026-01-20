import { FetchError } from "@medusajs/js-sdk"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"
import type { UserPolicy } from "../../lib/permissions"
import { queryKeysFactory } from "../../lib/query-key-factory"

const PERMISSIONS_QUERY_KEY = "permissions" as const
export const permissionsQueryKeys = {
  ...queryKeysFactory(PERMISSIONS_QUERY_KEY),
  me: () => [PERMISSIONS_QUERY_KEY, "me"] as const,
}

/**
 * Response type for the permissions API.
 */
export interface PermissionsResponse {
  policy: UserPolicy
}

/**
 * Hook to fetch the current user's permissions/policy.
 *
 * @example
 * ```tsx
 * const { policy, isLoading, isError } = useMyPermissions()
 *
 * if (policy?.permissions.includes("customer:read")) {
 *   // User can read customers
 * }
 * ```
 */
export const useMyPermissions = (
  options?: Omit<
    UseQueryOptions<
      PermissionsResponse,
      FetchError,
      PermissionsResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: permissionsQueryKeys.me(),
    queryFn: async () => {
      // TODO: Replace with actual SDK method when backend is implemented
      // return sdk.admin.permissions.me()

      // For now, return a mock response that grants all permissions
      // This should be replaced with the actual API call
      return getMockPermissions()
    },
    // Permissions don't change often, cache for longer
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    ...options,
  })

  return {
    policy: data?.policy ?? null,
    ...rest,
  }
}

/**
 * Mock permissions for development/testing.
 * Replace this with actual API call when backend is ready.
 */
function getMockPermissions(): PermissionsResponse {
  return {
    policy: {
      permissions: [
        // Customer permissions - full access for demo
        "customer:read",
        // "customer:create",
        // "customer:update",
        // "customer:delete",
        // "customer:manage",
        "customer_group:manage",

        // Order permissions - read only
        "order:read",

        // Product permissions - full access
        "product:manage",
        "product_category:manage",
        "product_collection:manage",
        "product_tag:manage",
        "product_type:manage",

        // Inventory
        "inventory:manage",
        "reservation:manage",

        // Promotions
        "promotion:manage",
        "campaign:manage",
        "price_list:manage",

        // Settings - limited access
        "region:read",
        "store:read",
        "user:read",
        "sales_channel:read",
        "stock_location:read",
        "tax_region:read",
        "api_key:read",
        "return_reason:read",
        "refund_reason:read",
        "workflow:read",
        "translation:read",
      ],
    },
  }
}

