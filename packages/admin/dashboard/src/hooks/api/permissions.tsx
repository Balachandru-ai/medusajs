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
 * TEMP: permissions response type
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
      // TODO: Replace with actual SDK

      // For now, return a mock response that grants all permissions
      // This should be replaced with the actual API call
      return getMockPermissions()
    },
    ...options,
  })

  return {
    policy: data?.policy ?? null,
    ...rest,
  }
}

/**
 * MOCK: permissions
 */
function getMockPermissions(): PermissionsResponse {
  return {
    policy: {
      permissions: [
        // Customer permissions - read only for demo
        "customer:read",
        // Uncomment for full access:
        "customer:create",
        // "customer:update",
        // "customer:delete",
        // Or use wildcard for full access:
        // "customer:*",

        "customer_group:*",

        // Order permissions - read only
        "order:read",

        // Product permissions - full access (wildcard)
        "product:*",
        "product_category:*",
        "product_collection:*",
        "product_tag:*",
        "product_type:*",

        // Inventory - full access
        "inventory:*",
        "reservation:*",

        // Promotions - full access
        "promotion:*",
        "campaign:*",
        "price_list:*",

        // Settings - read only
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
