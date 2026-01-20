import type { PermissionAction, PermissionResource } from "./types"

/**
 * All available permission resources mapped to their route paths.
 * This helps in automatically determining required permissions from routes.
 */
export const RESOURCE_ROUTE_MAP: Record<PermissionResource, string[]> = {
  customer: ["/customers"],
  customer_group: ["/customer-groups"],
  order: ["/orders"],
  product: ["/products"],
  product_category: ["/categories"],
  product_collection: ["/collections"],
  product_tag: ["/settings/product-tags"],
  product_type: ["/settings/product-types"],
  inventory: ["/inventory"],
  reservation: ["/reservations"],
  promotion: ["/promotions"],
  campaign: ["/campaigns"],
  price_list: ["/price-lists"],
  region: ["/settings/regions"],
  store: ["/settings/store"],
  user: ["/settings/users"],
  sales_channel: ["/settings/sales-channels"],
  stock_location: ["/settings/locations"],
  shipping_profile: ["/settings/locations/shipping-profiles"],
  shipping_option: ["/settings/locations"],
  tax_region: ["/settings/tax-regions"],
  api_key: ["/settings/publishable-api-keys", "/settings/secret-api-keys"],
  return_reason: ["/settings/return-reasons"],
  refund_reason: ["/settings/refund-reasons"],
  workflow: ["/settings/workflows"],
  translation: ["/settings/translations"],
}

/**
 * Permission actions with their semantic meanings.
 */
export const PERMISSION_ACTIONS: Record<PermissionAction, string> = {
  read: "View and list resources",
  create: "Create new resources",
  update: "Modify existing resources",
  delete: "Remove resources",
  manage: "Full access to all operations",
  "*": "Wildcard - full access",
}

/**
 * Actions that grant full access to a resource.
 */
export const FULL_ACCESS_ACTIONS: PermissionAction[] = ["manage", "*"]

/**
 * Map of actions to the actions they imply.
 * For example, "manage" implies all CRUD actions.
 */
export const ACTION_IMPLICATIONS: Record<PermissionAction, PermissionAction[]> =
  {
    read: ["read"],
    create: ["create"],
    update: ["update"],
    delete: ["delete"],
    manage: ["read", "create", "update", "delete", "manage"],
    "*": ["read", "create", "update", "delete", "manage", "*"],
  }

/**
 * Map route patterns to required permissions.
 * Used for automatic route-level permission checking.
 */
export const ROUTE_PERMISSIONS: Record<
  string,
  { resource: PermissionResource; action: PermissionAction }
> = {
  // Customer routes
  "/customers": { resource: "customer", action: "read" },
  "/customers/create": { resource: "customer", action: "create" },
  "/customers/:id": { resource: "customer", action: "read" },
  "/customers/:id/edit": { resource: "customer", action: "update" },

  // Customer Group routes
  "/customer-groups": { resource: "customer_group", action: "read" },
  "/customer-groups/create": { resource: "customer_group", action: "create" },
  "/customer-groups/:id": { resource: "customer_group", action: "read" },
  "/customer-groups/:id/edit": { resource: "customer_group", action: "update" },

  // Order routes
  "/orders": { resource: "order", action: "read" },
  "/orders/:id": { resource: "order", action: "read" },

  // Product routes
  "/products": { resource: "product", action: "read" },
  "/products/create": { resource: "product", action: "create" },
  "/products/:id": { resource: "product", action: "read" },
  "/products/:id/edit": { resource: "product", action: "update" },

  // Category routes
  "/categories": { resource: "product_category", action: "read" },
  "/categories/create": { resource: "product_category", action: "create" },
  "/categories/:id": { resource: "product_category", action: "read" },
  "/categories/:id/edit": { resource: "product_category", action: "update" },

  // Collection routes
  "/collections": { resource: "product_collection", action: "read" },
  "/collections/create": { resource: "product_collection", action: "create" },
  "/collections/:id": { resource: "product_collection", action: "read" },
  "/collections/:id/edit": { resource: "product_collection", action: "update" },

  // Inventory routes
  "/inventory": { resource: "inventory", action: "read" },
  "/inventory/create": { resource: "inventory", action: "create" },
  "/inventory/:id": { resource: "inventory", action: "read" },
  "/inventory/:id/edit": { resource: "inventory", action: "update" },

  // Reservation routes
  "/reservations": { resource: "reservation", action: "read" },
  "/reservations/create": { resource: "reservation", action: "create" },
  "/reservations/:id": { resource: "reservation", action: "read" },

  // Promotion routes
  "/promotions": { resource: "promotion", action: "read" },
  "/promotions/create": { resource: "promotion", action: "create" },
  "/promotions/:id": { resource: "promotion", action: "read" },
  "/promotions/:id/edit": { resource: "promotion", action: "update" },

  // Campaign routes
  "/campaigns": { resource: "campaign", action: "read" },
  "/campaigns/create": { resource: "campaign", action: "create" },
  "/campaigns/:id": { resource: "campaign", action: "read" },
  "/campaigns/:id/edit": { resource: "campaign", action: "update" },

  // Price List routes
  "/price-lists": { resource: "price_list", action: "read" },
  "/price-lists/create": { resource: "price_list", action: "create" },
  "/price-lists/:id": { resource: "price_list", action: "read" },
  "/price-lists/:id/edit": { resource: "price_list", action: "update" },

  // Settings routes
  "/settings/regions": { resource: "region", action: "read" },
  "/settings/regions/create": { resource: "region", action: "create" },
  "/settings/regions/:id": { resource: "region", action: "read" },
  "/settings/regions/:id/edit": { resource: "region", action: "update" },

  "/settings/store": { resource: "store", action: "read" },
  "/settings/store/edit": { resource: "store", action: "update" },

  "/settings/users": { resource: "user", action: "read" },
  "/settings/users/invite": { resource: "user", action: "create" },
  "/settings/users/:id": { resource: "user", action: "read" },
  "/settings/users/:id/edit": { resource: "user", action: "update" },

  "/settings/sales-channels": { resource: "sales_channel", action: "read" },
  "/settings/sales-channels/create": {
    resource: "sales_channel",
    action: "create",
  },
  "/settings/sales-channels/:id": { resource: "sales_channel", action: "read" },
  "/settings/sales-channels/:id/edit": {
    resource: "sales_channel",
    action: "update",
  },

  "/settings/locations": { resource: "stock_location", action: "read" },
  "/settings/locations/create": { resource: "stock_location", action: "create" },
  "/settings/locations/:id": { resource: "stock_location", action: "read" },
  "/settings/locations/:id/edit": {
    resource: "stock_location",
    action: "update",
  },

  "/settings/tax-regions": { resource: "tax_region", action: "read" },
  "/settings/tax-regions/create": { resource: "tax_region", action: "create" },
  "/settings/tax-regions/:id": { resource: "tax_region", action: "read" },
  "/settings/tax-regions/:id/edit": { resource: "tax_region", action: "update" },

  "/settings/publishable-api-keys": { resource: "api_key", action: "read" },
  "/settings/publishable-api-keys/create": {
    resource: "api_key",
    action: "create",
  },
  "/settings/publishable-api-keys/:id": { resource: "api_key", action: "read" },
  "/settings/publishable-api-keys/:id/edit": {
    resource: "api_key",
    action: "update",
  },

  "/settings/secret-api-keys": { resource: "api_key", action: "read" },
  "/settings/secret-api-keys/create": { resource: "api_key", action: "create" },
  "/settings/secret-api-keys/:id": { resource: "api_key", action: "read" },
  "/settings/secret-api-keys/:id/edit": {
    resource: "api_key",
    action: "update",
  },

  "/settings/product-tags": { resource: "product_tag", action: "read" },
  "/settings/product-tags/create": { resource: "product_tag", action: "create" },
  "/settings/product-tags/:id": { resource: "product_tag", action: "read" },
  "/settings/product-tags/:id/edit": {
    resource: "product_tag",
    action: "update",
  },

  "/settings/product-types": { resource: "product_type", action: "read" },
  "/settings/product-types/create": {
    resource: "product_type",
    action: "create",
  },
  "/settings/product-types/:id": { resource: "product_type", action: "read" },
  "/settings/product-types/:id/edit": {
    resource: "product_type",
    action: "update",
  },

  "/settings/return-reasons": { resource: "return_reason", action: "read" },
  "/settings/return-reasons/create": {
    resource: "return_reason",
    action: "create",
  },
  "/settings/return-reasons/:id/edit": {
    resource: "return_reason",
    action: "update",
  },

  "/settings/refund-reasons": { resource: "refund_reason", action: "read" },
  "/settings/refund-reasons/create": {
    resource: "refund_reason",
    action: "create",
  },
  "/settings/refund-reasons/:id/edit": {
    resource: "refund_reason",
    action: "update",
  },

  "/settings/workflows": { resource: "workflow", action: "read" },
  "/settings/workflows/:id": { resource: "workflow", action: "read" },

  "/settings/translations": { resource: "translation", action: "read" },
  "/settings/translations/edit": { resource: "translation", action: "update" },
}
