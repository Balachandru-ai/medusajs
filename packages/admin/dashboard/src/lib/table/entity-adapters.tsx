import { HttpTypes } from "@medusajs/types"
import { ColumnAdapter } from "../../hooks/table/columns/use-configurable-table-columns"

// Order-specific column adapter
export const orderColumnAdapter: ColumnAdapter<HttpTypes.AdminOrder> = {
  getColumnAlignment: (column) => {
    // Custom alignment for order columns
    if (column.field === "display_id") return "center"
    if (column.semantic_type === "currency") return "right"
    if (column.semantic_type === "status") return "center"
    if (column.computed?.type === "country_code") return "center"
    return "left"
  }
}

// Product-specific column adapter
export const productColumnAdapter: ColumnAdapter<HttpTypes.AdminProduct> = {
  getColumnAlignment: (column) => {
    // Custom alignment for product columns
    if (column.field === "sku") return "center"
    if (column.field === "stock") return "right"
    if (column.semantic_type === "currency") return "right"
    if (column.semantic_type === "status") return "center"
    return "left"
  },
  
  transformCellValue: (value, row, column) => {
    // Custom transformation for product-specific fields
    if (column.field === "variants_count") {
      return `${value || 0} variants`
    }
    
    if (column.field === "status" && value === "draft") {
      return <span className="text-ui-fg-muted">Draft</span>
    }
    
    // Default to standard display
    return null
  }
}

// Customer-specific column adapter
export const customerColumnAdapter: ColumnAdapter<HttpTypes.AdminCustomer> = {
  getColumnAlignment: (column) => {
    if (column.field === "orders_count") return "right"
    if (column.semantic_type === "currency") return "right"
    if (column.semantic_type === "status") return "center"
    return "left"
  },
  
  transformCellValue: (value, row, column) => {
    // Format customer name
    if (column.field === "name") {
      const { first_name, last_name } = row
      if (first_name || last_name) {
        return `${first_name || ""} ${last_name || ""}`.trim()
      }
      return "-"
    }
    
    return null
  }
}

// Inventory-specific column adapter
export const inventoryColumnAdapter: ColumnAdapter<HttpTypes.AdminInventoryItem> = {
  getColumnAlignment: (column) => {
    if (column.field === "stocked_quantity") return "right"
    if (column.field === "reserved_quantity") return "right"
    if (column.field === "available_quantity") return "right"
    if (column.semantic_type === "status") return "center"
    return "left"
  }
}

// Registry of entity adapters
export const entityAdapters = {
  orders: orderColumnAdapter,
  products: productColumnAdapter,
  customers: customerColumnAdapter,
  inventory: inventoryColumnAdapter,
} as const

export type EntityType = keyof typeof entityAdapters

// Helper function to get adapter for an entity
export function getEntityAdapter<TData = any>(entity: string): ColumnAdapter<TData> | undefined {
  return entityAdapters[entity as EntityType] as ColumnAdapter<TData>
}