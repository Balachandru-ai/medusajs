import { FieldFilterRules } from "./filter-rules"
import { ComputedColumnDefinition } from "./computed-columns"

/**
 * Override configuration for an entity.
 * Allows customizing how columns are generated and displayed.
 */
export interface EntityOverride {
  /**
   * Specific field names to exclude.
   */
  excludeFields?: string[]

  /**
   * Field name suffixes to exclude.
   */
  excludeSuffixes?: string[]

  /**
   * Field name prefixes to exclude.
   */
  excludePrefixes?: string[]

  /**
   * Fields to show by default (in order).
   */
  defaultVisibleFields?: string[]

  /**
   * Custom ordering for fields (field name -> order number).
   * Lower numbers appear first.
   */
  fieldOrdering?: Record<string, number>

  /**
   * Additional GraphQL types to include fields from.
   */
  additionalTypes?: string[]

  /**
   * Computed columns specific to this entity.
   * Note: Computed columns can also be defined in the ComputedColumnRegistry.
   */
  computedColumns?: ComputedColumnDefinition[]
}

/**
 * Entity-specific overrides migrated from entity-mappings.ts.
 * These provide backward compatibility and customization for core entities.
 */
export const ENTITY_OVERRIDES: Record<string, EntityOverride> = {
  Order: {
    excludeSuffixes: ["_link"],
    excludePrefixes: ["raw_"],
    excludeFields: ["order_change"],
    additionalTypes: ["OrderDetail"],
    defaultVisibleFields: [
      "display_id",
      "created_at",
      "payment_status",
      "fulfillment_status",
      "total",
      "customer_display",
      "country",
      "sales_channel.name",
    ],
    fieldOrdering: {
      display_id: 100,
      custom_display_id: 101,
      created_at: 200,
      customer_display: 300,
      "sales_channel.name": 400,
      fulfillment_status: 500,
      payment_status: 600,
      total: 700,
      country: 800,
    },
  },
  Product: {
    excludeSuffixes: ["_link"],
    excludePrefixes: ["raw_"],
    excludeFields: [],
    defaultVisibleFields: [
      "product_display",
      "collection.title",
      "sales_channels_display",
      "variants_count",
      "status",
    ],
    fieldOrdering: {
      product_display: 100,
      "collection.title": 200,
      sales_channels_display: 300,
      variants_count: 400,
      status: 500,
    },
  },
  Customer: {
    excludeSuffixes: ["_link"],
    excludePrefixes: ["raw_"],
    excludeFields: [],
    defaultVisibleFields: [
      "email",
      "first_name",
      "last_name",
      "created_at",
      "updated_at",
    ],
    fieldOrdering: {},
  },
  User: {
    excludeSuffixes: ["_link"],
    excludePrefixes: ["raw_"],
    excludeFields: [],
    defaultVisibleFields: [
      "email",
      "first_name",
      "last_name",
      "created_at",
      "updated_at",
    ],
    fieldOrdering: {},
  },
  Region: {
    excludeSuffixes: ["_link"],
    excludePrefixes: ["raw_"],
    excludeFields: [],
    defaultVisibleFields: ["name", "currency_code", "created_at", "updated_at"],
    fieldOrdering: {},
  },
  SalesChannel: {
    excludeSuffixes: ["_link"],
    excludePrefixes: ["raw_"],
    excludeFields: [],
    defaultVisibleFields: [
      "name",
      "description",
      "is_disabled",
      "created_at",
      "updated_at",
    ],
    fieldOrdering: {},
  },
}

/**
 * Get the entity override for an entity name.
 * Returns undefined if no override exists.
 */
export function getEntityOverride(
  entityName: string
): EntityOverride | undefined {
  return ENTITY_OVERRIDES[entityName]
}

/**
 * Check if an entity has custom overrides.
 */
export function hasEntityOverride(entityName: string): boolean {
  return entityName in ENTITY_OVERRIDES
}

/**
 * Get the field filter rules for an entity, merging with defaults.
 */
export function getFieldFilterRules(entityName: string): FieldFilterRules {
  const override = getEntityOverride(entityName)

  return {
    excludeSuffixes: override?.excludeSuffixes || ["_link"],
    excludePrefixes: override?.excludePrefixes || ["raw_"],
    excludeFields: override?.excludeFields || [],
  }
}

/**
 * Get the default visible fields for an entity.
 */
export function getDefaultVisibleFields(entityName: string): string[] {
  const override = getEntityOverride(entityName)
  return override?.defaultVisibleFields || []
}

/**
 * Get the field ordering for an entity.
 */
export function getFieldOrdering(entityName: string): Record<string, number> {
  const override = getEntityOverride(entityName)
  return override?.fieldOrdering || {}
}

/**
 * Get additional types to include for an entity.
 */
export function getAdditionalTypes(entityName: string): string[] {
  const override = getEntityOverride(entityName)
  return override?.additionalTypes || []
}

/**
 * Map from plural/route names to entity names for backward compatibility.
 */
export const ROUTE_TO_ENTITY_MAP: Record<string, string> = {
  orders: "Order",
  products: "Product",
  customers: "Customer",
  users: "User",
  regions: "Region",
  "sales-channels": "SalesChannel",
}

/**
 * Get the entity name from a route/plural name.
 */
export function entityNameFromRoute(routeName: string): string | undefined {
  return ROUTE_TO_ENTITY_MAP[routeName]
}
