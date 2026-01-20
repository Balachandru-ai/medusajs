import type { PermissionOperation, PermissionResource } from "./types"

/**
 * All available permission resources mapped to their routes
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
 * Operations that grant full access to a resource.
 */
export const FULL_ACCESS_OPERATIONS: PermissionOperation[] = ["*"]

/**
 * Map of operations to the operations they imply.
 * The wildcard (*) implies all CRUD operations.
 */
export const OPERATION_IMPLICATIONS: Record<
  PermissionOperation,
  PermissionOperation[]
> = {
  read: ["read"],
  create: ["create"],
  update: ["update"],
  delete: ["delete"],
  "*": ["read", "create", "update", "delete", "*"],
}

/**
 * Map routes to required permissions.
 */
export const ROUTE_PERMISSIONS: Record<
  string,
  { resource: PermissionResource; operation: PermissionOperation }
> = {
  // Customer routes
  "/customers": { resource: "customer", operation: "read" },
  "/customers/create": { resource: "customer", operation: "create" },
  "/customers/:id": { resource: "customer", operation: "read" },
  "/customers/:id/edit": { resource: "customer", operation: "update" },

  // Customer Group routes
  "/customer-groups": { resource: "customer_group", operation: "read" },
  "/customer-groups/create": {
    resource: "customer_group",
    operation: "create",
  },
  "/customer-groups/:id": { resource: "customer_group", operation: "read" },
  "/customer-groups/:id/edit": {
    resource: "customer_group",
    operation: "update",
  },

  // Order routes
  "/orders": { resource: "order", operation: "read" },
  "/orders/:id": { resource: "order", operation: "read" },

  // Product routes
  "/products": { resource: "product", operation: "read" },
  "/products/create": { resource: "product", operation: "create" },
  "/products/:id": { resource: "product", operation: "read" },
  "/products/:id/edit": { resource: "product", operation: "update" },

  // Category routes
  "/categories": { resource: "product_category", operation: "read" },
  "/categories/create": { resource: "product_category", operation: "create" },
  "/categories/:id": { resource: "product_category", operation: "read" },
  "/categories/:id/edit": { resource: "product_category", operation: "update" },

  // Collection routes
  "/collections": { resource: "product_collection", operation: "read" },
  "/collections/create": {
    resource: "product_collection",
    operation: "create",
  },
  "/collections/:id": { resource: "product_collection", operation: "read" },
  "/collections/:id/edit": {
    resource: "product_collection",
    operation: "update",
  },

  // Inventory routes
  "/inventory": { resource: "inventory", operation: "read" },
  "/inventory/create": { resource: "inventory", operation: "create" },
  "/inventory/:id": { resource: "inventory", operation: "read" },
  "/inventory/:id/edit": { resource: "inventory", operation: "update" },

  // Reservation routes
  "/reservations": { resource: "reservation", operation: "read" },
  "/reservations/create": { resource: "reservation", operation: "create" },
  "/reservations/:id": { resource: "reservation", operation: "read" },

  // Promotion routes
  "/promotions": { resource: "promotion", operation: "read" },
  "/promotions/create": { resource: "promotion", operation: "create" },
  "/promotions/:id": { resource: "promotion", operation: "read" },
  "/promotions/:id/edit": { resource: "promotion", operation: "update" },

  // Campaign routes
  "/campaigns": { resource: "campaign", operation: "read" },
  "/campaigns/create": { resource: "campaign", operation: "create" },
  "/campaigns/:id": { resource: "campaign", operation: "read" },
  "/campaigns/:id/edit": { resource: "campaign", operation: "update" },

  // Price List routes
  "/price-lists": { resource: "price_list", operation: "read" },
  "/price-lists/create": { resource: "price_list", operation: "create" },
  "/price-lists/:id": { resource: "price_list", operation: "read" },
  "/price-lists/:id/edit": { resource: "price_list", operation: "update" },

  // Settings routes
  "/settings/regions": { resource: "region", operation: "read" },
  "/settings/regions/create": { resource: "region", operation: "create" },
  "/settings/regions/:id": { resource: "region", operation: "read" },
  "/settings/regions/:id/edit": { resource: "region", operation: "update" },

  "/settings/store": { resource: "store", operation: "read" },
  "/settings/store/edit": { resource: "store", operation: "update" },

  "/settings/users": { resource: "user", operation: "read" },
  "/settings/users/invite": { resource: "user", operation: "create" },
  "/settings/users/:id": { resource: "user", operation: "read" },
  "/settings/users/:id/edit": { resource: "user", operation: "update" },

  "/settings/sales-channels": { resource: "sales_channel", operation: "read" },
  "/settings/sales-channels/create": {
    resource: "sales_channel",
    operation: "create",
  },
  "/settings/sales-channels/:id": {
    resource: "sales_channel",
    operation: "read",
  },
  "/settings/sales-channels/:id/edit": {
    resource: "sales_channel",
    operation: "update",
  },

  "/settings/locations": { resource: "stock_location", operation: "read" },
  "/settings/locations/create": {
    resource: "stock_location",
    operation: "create",
  },
  "/settings/locations/:id": { resource: "stock_location", operation: "read" },
  "/settings/locations/:id/edit": {
    resource: "stock_location",
    operation: "update",
  },

  "/settings/tax-regions": { resource: "tax_region", operation: "read" },
  "/settings/tax-regions/create": {
    resource: "tax_region",
    operation: "create",
  },
  "/settings/tax-regions/:id": { resource: "tax_region", operation: "read" },
  "/settings/tax-regions/:id/edit": {
    resource: "tax_region",
    operation: "update",
  },

  "/settings/publishable-api-keys": { resource: "api_key", operation: "read" },
  "/settings/publishable-api-keys/create": {
    resource: "api_key",
    operation: "create",
  },
  "/settings/publishable-api-keys/:id": {
    resource: "api_key",
    operation: "read",
  },
  "/settings/publishable-api-keys/:id/edit": {
    resource: "api_key",
    operation: "update",
  },

  "/settings/secret-api-keys": { resource: "api_key", operation: "read" },
  "/settings/secret-api-keys/create": {
    resource: "api_key",
    operation: "create",
  },
  "/settings/secret-api-keys/:id": { resource: "api_key", operation: "read" },
  "/settings/secret-api-keys/:id/edit": {
    resource: "api_key",
    operation: "update",
  },

  "/settings/product-tags": { resource: "product_tag", operation: "read" },
  "/settings/product-tags/create": {
    resource: "product_tag",
    operation: "create",
  },
  "/settings/product-tags/:id": { resource: "product_tag", operation: "read" },
  "/settings/product-tags/:id/edit": {
    resource: "product_tag",
    operation: "update",
  },

  "/settings/product-types": { resource: "product_type", operation: "read" },
  "/settings/product-types/create": {
    resource: "product_type",
    operation: "create",
  },
  "/settings/product-types/:id": {
    resource: "product_type",
    operation: "read",
  },
  "/settings/product-types/:id/edit": {
    resource: "product_type",
    operation: "update",
  },

  "/settings/return-reasons": { resource: "return_reason", operation: "read" },
  "/settings/return-reasons/create": {
    resource: "return_reason",
    operation: "create",
  },
  "/settings/return-reasons/:id/edit": {
    resource: "return_reason",
    operation: "update",
  },

  "/settings/refund-reasons": { resource: "refund_reason", operation: "read" },
  "/settings/refund-reasons/create": {
    resource: "refund_reason",
    operation: "create",
  },
  "/settings/refund-reasons/:id/edit": {
    resource: "refund_reason",
    operation: "update",
  },

  "/settings/workflows": { resource: "workflow", operation: "read" },
  "/settings/workflows/:id": { resource: "workflow", operation: "read" },

  "/settings/translations": { resource: "translation", operation: "read" },
  "/settings/translations/edit": {
    resource: "translation",
    operation: "update",
  },
}
