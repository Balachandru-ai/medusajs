import { useQuery } from "@tanstack/react-query"

export type Permission = string

export type PermissionsResponse = {
  permissions: Permission[]
  role: {
    id: string
    name: string
  } | null
}

const MOCK_PERMISSIONS_RESPONSE: PermissionsResponse = {
  permissions: ["products:create", "price_lists:manage"],
  role: {
    id: "product_catalog_manager",
    name: "Product Catalog manager",
  },
}

export const permissionsQueryKeys = {
  all: ["permissions"] as const,
  me: () => [...permissionsQueryKeys.all, "me"] as const,
}

export const useUserPermissions = () => {
  return useQuery<PermissionsResponse>({
    queryKey: permissionsQueryKeys.me(),
    queryFn: async () => {
      return MOCK_PERMISSIONS_RESPONSE
    },
  })
}
