/**
 * Relationship filter configuration utilities.
 * Configures dropdown filters for relationship fields.
 */

/**
 * Configuration for a relationship filter.
 */
export interface RelationshipFilterDefinition {
  /**
   * The relationship field (e.g., "sales_channels").
   */
  field: string

  /**
   * Related entity name (e.g., "SalesChannel").
   */
  relatedEntity: string

  /**
   * Field to use as filter value (e.g., "id").
   */
  valueField: string

  /**
   * Field to display in dropdown (e.g., "name").
   */
  displayField: string

  /**
   * Whether multiple selection is allowed.
   */
  multiple: boolean
}

/**
 * Relationship filter config as returned in column metadata.
 */
export interface RelationshipFilterConfig {
  entity: string
  value_field: string
  display_field: string
  multiple: boolean
  endpoint: string
}

/**
 * Maps entity names to their admin API endpoints.
 */
export const ENTITY_ENDPOINT_MAP: Record<string, string> = {
  SalesChannel: "/admin/sales-channels",
  ProductCollection: "/admin/collections",
  ProductType: "/admin/product-types",
  ProductTag: "/admin/product-tags",
  Region: "/admin/regions",
  CustomerGroup: "/admin/customer-groups",
  Currency: "/admin/currencies",
  Store: "/admin/stores",
  StockLocation: "/admin/stock-locations",
  ShippingProfile: "/admin/shipping-profiles",
  ShippingOption: "/admin/shipping-options",
  Fulfillment: "/admin/fulfillments",
  PaymentProvider: "/admin/payment-providers",
  TaxRegion: "/admin/tax-regions",
  TaxRate: "/admin/tax-rates",
}

/**
 * Convert PascalCase to kebab-case.
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, (match, offset) => (offset > 0 ? `-${match}` : match))
    .toLowerCase()
}

/**
 * Simple pluralization.
 */
function pluralize(str: string): string {
  if (str.endsWith("y")) {
    return str.slice(0, -1) + "ies"
  }
  if (str.endsWith("s")) {
    return str
  }
  return str + "s"
}

/**
 * Infer the API endpoint for fetching filter options.
 */
export function inferOptionsEndpoint(entityName: string): string {
  if (ENTITY_ENDPOINT_MAP[entityName]) {
    return ENTITY_ENDPOINT_MAP[entityName]
  }

  // Auto-generate: "SalesChannel" → "/admin/sales-channels"
  return `/admin/${toKebabCase(pluralize(entityName))}`
}

/**
 * Built-in relationship filter configurations for known entities.
 */
export const RELATIONSHIP_FILTER_OVERRIDES: Record<
  string,
  RelationshipFilterDefinition[]
> = {
  Product: [
    {
      field: "sales_channels",
      relatedEntity: "SalesChannel",
      valueField: "id",
      displayField: "name",
      multiple: true,
    },
    {
      field: "collection",
      relatedEntity: "ProductCollection",
      valueField: "id",
      displayField: "title",
      multiple: false,
    },
    {
      field: "type",
      relatedEntity: "ProductType",
      valueField: "id",
      displayField: "value",
      multiple: false,
    },
    {
      field: "tags",
      relatedEntity: "ProductTag",
      valueField: "id",
      displayField: "value",
      multiple: true,
    },
  ],
  Order: [
    {
      field: "sales_channel",
      relatedEntity: "SalesChannel",
      valueField: "id",
      displayField: "name",
      multiple: false,
    },
    {
      field: "region",
      relatedEntity: "Region",
      valueField: "id",
      displayField: "name",
      multiple: false,
    },
  ],
  Customer: [
    {
      field: "groups",
      relatedEntity: "CustomerGroup",
      valueField: "id",
      displayField: "name",
      multiple: true,
    },
  ],
}

/**
 * Common display fields to look for when auto-detecting.
 */
const DISPLAY_FIELD_CANDIDATES = ["name", "title", "value", "label", "email"]

/**
 * Get the relationship filter configuration for a field.
 */
export function getRelationshipFilterConfig(
  entityName: string,
  fieldName: string,
  relatedEntityName: string,
  isMultiple: boolean
): RelationshipFilterConfig | null {
  // Check if we have a predefined configuration
  const entityOverrides = RELATIONSHIP_FILTER_OVERRIDES[entityName]
  if (entityOverrides) {
    const override = entityOverrides.find((o) => o.field === fieldName)
    if (override) {
      return {
        entity: override.relatedEntity,
        value_field: override.valueField,
        display_field: override.displayField,
        multiple: override.multiple,
        endpoint: inferOptionsEndpoint(override.relatedEntity),
      }
    }
  }

  // Auto-generate configuration
  // Use "name" as the default display field, falling back to "title" or "value"
  const displayField = DISPLAY_FIELD_CANDIDATES[0] // Default to "name"

  return {
    entity: relatedEntityName,
    value_field: "id",
    display_field: displayField,
    multiple: isMultiple,
    endpoint: inferOptionsEndpoint(relatedEntityName),
  }
}

/**
 * Check if a relationship field should have a filter dropdown.
 * Returns true for relationships to "small" entities that make sense as filters.
 */
export function shouldHaveRelationshipFilter(
  relatedEntityName: string
): boolean {
  // These entities typically have few records and make good filter options
  const filterableEntities = [
    "SalesChannel",
    "ProductCollection",
    "ProductType",
    "ProductTag",
    "Region",
    "CustomerGroup",
    "Currency",
    "Store",
    "StockLocation",
    "ShippingProfile",
    "FulfillmentProvider",
    "PaymentProvider",
    "TaxRegion",
    "Country",
  ]

  return filterableEntities.includes(relatedEntityName)
}
