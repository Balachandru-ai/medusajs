import React from "react"
import { Badge, StatusBadge, Tooltip } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import ReactCountryFlag from "react-country-flag"
import { getCountryByIso2 } from "../data/countries"

// Import product-specific cell components
import { ProductCell } from "../../components/table/table-cells/product/product-cell"
import { CollectionCell } from "../../components/table/table-cells/product/collection-cell"
import { SalesChannelsCell } from "../../components/table/table-cells/product/sales-channels-cell"
import { VariantCell } from "../../components/table/table-cells/product/variant-cell"
import { ProductStatusCell } from "../../components/table/table-cells/product/product-status-cell"

// Import common cell components
import { DateCell } from "../../components/table/table-cells/common/date-cell"

// Import order-specific cell components
import { DisplayIdCell } from "../../components/table/table-cells/order/display-id-cell"
import { TotalCell } from "../../components/table/table-cells/order/total-cell"
import { MoneyAmountCell } from "../../components/table/table-cells/common/money-amount-cell"

// Type definitions
export type CellRenderer<TData = any> = (
  value: any,
  row: TData,
  column: HttpTypes.AdminColumn
) => React.ReactNode

export type RendererRegistry = Map<string, CellRenderer>

// Create the registry
const cellRenderers: RendererRegistry = new Map()

// Helper function to get nested value from object using dot notation
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Built-in generic renderers
const TextRenderer: CellRenderer = (value) => {
  if (value === null || value === undefined) return '-'
  return String(value)
}

const CountRenderer: CellRenderer = (value, row, column) => {
  // Handle different count scenarios
  if (column.field === 'variants_count' || column.field === 'variants') {
    const variants = row.variants || []
    const count = Array.isArray(variants) ? variants.length : 0
    return `${count} ${count === 1 ? 'variant' : 'variants'}`
  }
  
  // Generic count
  const items = value || []
  const count = Array.isArray(items) ? items.length : 0
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

const StatusRenderer: CellRenderer = (value, row, column) => {
  if (!value) return '-'
  
  // For product status specifically (check if it's a product by looking for product-specific fields)
  if (column.field === 'status' && row.status && (row.handle || row.is_giftcard !== undefined)) {
    return <ProductStatusCell status={row.status} />
  }
  
  // Generic status badge
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'published':
      case 'fulfilled':
      case 'paid':
        return 'green'
      case 'pending':
      case 'proposed':
      case 'processing':
        return 'orange'
      case 'draft':
        return 'grey'
      case 'rejected':
      case 'failed':
      case 'canceled':
        return 'red'
      default:
        return 'grey'
    }
  }
  
  return (
    <StatusBadge color={getStatusColor(value)}>
      {value}
    </StatusBadge>
  )
}

const BadgeListRenderer: CellRenderer = (value, row, column) => {
  // For sales channels
  if (column.field === 'sales_channels_display' || column.field === 'sales_channels') {
    return <SalesChannelsCell salesChannels={row.sales_channels} />
  }
  
  // Generic badge list
  if (!Array.isArray(value)) return '-'
  
  const items = value.slice(0, 2)
  const remaining = value.length - 2
  
  return (
    <div className="flex gap-1">
      {items.map((item, index) => (
        <Badge key={index} size="xsmall">
          {typeof item === 'string' ? item : item.name || item.title || '-'}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge size="xsmall" color="grey">
          +{remaining}
        </Badge>
      )}
    </div>
  )
}

// Product-specific renderers
const ProductInfoRenderer: CellRenderer = (value, row) => {
  // Use the existing ProductCell component
  return <ProductCell product={row} />
}

const CollectionRenderer: CellRenderer = (value, row) => {
  // Use the existing CollectionCell component
  return <CollectionCell collection={row.collection} />
}

const VariantsRenderer: CellRenderer = (value, row) => {
  // Use the existing VariantCell component
  return <VariantCell variants={row.variants} />
}

// Order-specific renderers
const CustomerNameRenderer: CellRenderer = (value, row) => {
  // Try customer object first
  if (row.customer?.first_name || row.customer?.last_name) {
    const fullName = `${row.customer.first_name || ''} ${row.customer.last_name || ''}`.trim()
    if (fullName) return fullName
  }
  
  // Fall back to email
  if (row.customer?.email) {
    return row.customer.email
  }
  
  // Fall back to phone
  if (row.customer?.phone) {
    return row.customer.phone
  }
  
  return 'Guest'
}

const AddressSummaryRenderer: CellRenderer = (value, row, column) => {
  // Determine which address to use based on the column field
  let address = null
  if (column.field === 'shipping_address_display') {
    address = row.shipping_address
  } else if (column.field === 'billing_address_display') {
    address = row.billing_address
  } else {
    // Fallback to shipping address if no specific field
    address = row.shipping_address || row.billing_address
  }
  
  if (!address) return '-'
  
  // Build address parts in a meaningful order
  const parts = []
  
  // Include street address if available
  if (address.address_1) {
    parts.push(address.address_1)
  }
  
  // City, Province/State, Postal Code
  const locationParts = []
  if (address.city) locationParts.push(address.city)
  if (address.province) locationParts.push(address.province)
  if (address.postal_code) locationParts.push(address.postal_code)
  
  if (locationParts.length > 0) {
    parts.push(locationParts.join(', '))
  }
  
  // Country
  if (address.country_code) {
    parts.push(address.country_code.toUpperCase())
  }
  
  return parts.join(' • ') || '-'
}

const CountryCodeRenderer: CellRenderer = (value, row) => {
  // Get country code from shipping address
  const countryCode = row.shipping_address?.country_code
  
  if (!countryCode) return <div className="flex w-full justify-center">-</div>
  
  // Get country information
  const country = getCountryByIso2(countryCode)
  const displayName = country?.display_name || countryCode.toUpperCase()
  
  // Display country flag with tooltip - centered in the cell
  return (
    <div className="flex w-full items-center justify-center">
      <Tooltip content={displayName}>
        <div className="flex size-4 items-center justify-center overflow-hidden rounded-sm">
          <ReactCountryFlag
            countryCode={countryCode.toUpperCase()}
            svg
            style={{
              width: "16px",
              height: "16px",
            }}
            aria-label={displayName}
          />
        </div>
      </Tooltip>
    </div>
  )
}

const DateRenderer: CellRenderer = (value) => {
  // DateCell component handles null/undefined values
  return <DateCell date={value} />
}

const DisplayIdRenderer: CellRenderer = (value) => {
  // DisplayIdCell component handles null/undefined values
  return <DisplayIdCell displayId={value} />
}

const CurrencyRenderer: CellRenderer = (value, row) => {
  // For total field specifically, we need the currency code from the row
  const currencyCode = row.currency_code || 'USD'
  
  // MoneyAmountCell handles formatting and alignment
  return <MoneyAmountCell currencyCode={currencyCode} amount={value} align="right" />
}

const TotalRenderer: CellRenderer = (value, row) => {
  // TotalCell needs both total and currency code
  const currencyCode = row.currency_code || 'USD'
  
  return <TotalCell currencyCode={currencyCode} total={value} />
}

// Register built-in renderers
cellRenderers.set('text', TextRenderer)
cellRenderers.set('count', CountRenderer)
cellRenderers.set('status', StatusRenderer)
cellRenderers.set('badge_list', BadgeListRenderer)
cellRenderers.set('date', DateRenderer)
cellRenderers.set('timestamp', DateRenderer)
cellRenderers.set('currency', CurrencyRenderer)
cellRenderers.set('total', TotalRenderer)

// Register product-specific renderers
cellRenderers.set('product_info', ProductInfoRenderer)
cellRenderers.set('collection', CollectionRenderer)
cellRenderers.set('variants', VariantsRenderer)
cellRenderers.set('sales_channels_list', BadgeListRenderer)

// Register order-specific renderers
cellRenderers.set('customer_name', CustomerNameRenderer)
cellRenderers.set('address_summary', AddressSummaryRenderer)
cellRenderers.set('country_code', CountryCodeRenderer)
cellRenderers.set('display_id', DisplayIdRenderer)

// Export functions
export function getCellRenderer(
  renderType?: string,
  dataType?: string
): CellRenderer {
  // Try to get renderer by render type
  if (renderType && cellRenderers.has(renderType)) {
    return cellRenderers.get(renderType)!
  }
  
  // Fall back to data type defaults
  switch (dataType) {
    case 'number':
    case 'string':
      return TextRenderer
    case 'date':
      return DateRenderer
    case 'boolean':
      return (value) => value ? 'Yes' : 'No'
    case 'enum':
      return StatusRenderer
    case 'currency':
      return CurrencyRenderer
    default:
      return TextRenderer
  }
}

export function registerCellRenderer(type: string, renderer: CellRenderer) {
  cellRenderers.set(type, renderer)
}

// Helper to get value for a column from a row
export function getColumnValue(row: any, column: HttpTypes.AdminColumn): any {
  // For computed columns, we might need to gather multiple fields
  if (column.computed) {
    // Return the row itself for computed columns to have access to all data
    return row
  }
  
  // For regular fields, get the nested value
  return getNestedValue(row, column.field)
}