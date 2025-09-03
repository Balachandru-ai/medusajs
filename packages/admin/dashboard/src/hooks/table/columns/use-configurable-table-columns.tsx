import React, { useMemo } from "react"
import { createDataTableColumnHelper } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { getCellRenderer, getColumnValue } from "../../../lib/table/cell-renderers"

export interface ColumnAdapter<TData> {
  getColumnAlignment?: (column: HttpTypes.AdminColumn) => "left" | "center" | "right"
  getCustomAccessor?: (field: string, column: HttpTypes.AdminColumn) => any
  transformCellValue?: (value: any, row: TData, column: HttpTypes.AdminColumn) => React.ReactNode
}

export function useConfigurableTableColumns<TData = any>(
  entity: string,
  apiColumns: HttpTypes.AdminColumn[] | undefined,
  adapter?: ColumnAdapter<TData>
) {
  const columnHelper = createDataTableColumnHelper<TData>()

  return useMemo(() => {
    if (!apiColumns?.length) {
      return []
    }

    return apiColumns.map(apiColumn => {
      // Get the cell renderer for this column
      // Check semantic_type for special rendering
      let renderType = apiColumn.render_type || apiColumn.computed?.type
      
      // Map semantic types to render types
      if (!renderType) {
        if (apiColumn.semantic_type === 'timestamp') {
          renderType = 'timestamp'
        } else if (apiColumn.field === 'display_id') {
          // Special case for display_id
          renderType = 'display_id'
        } else if (apiColumn.field === 'total') {
          // Special case for total field
          renderType = 'total'
        } else if (apiColumn.semantic_type === 'currency') {
          // General currency fields
          renderType = 'currency'
        }
      }
      
      const renderer = getCellRenderer(
        renderType,
        apiColumn.data_type
      )

      // Determine header alignment
      const headerAlign = adapter?.getColumnAlignment
        ? adapter.getColumnAlignment(apiColumn)
        : getDefaultColumnAlignment(apiColumn)

      // Create accessor function
      const accessor = (row: TData) => getColumnValue(row, apiColumn)

      return columnHelper.accessor(accessor, {
        id: apiColumn.field,
        header: () => apiColumn.name,
        cell: ({ getValue, row }) => {
          const value = getValue()

          // Allow adapter to transform the value first
          if (adapter?.transformCellValue) {
            const transformed = adapter.transformCellValue(value, row.original, apiColumn)
            if (transformed !== null) {
              return transformed
            }
          }

          // Use the renderer to display the value
          return renderer(value, row.original, apiColumn)
        },
        meta: {
          name: apiColumn.name,
          column: apiColumn, // Store column metadata for future use
        },
        enableHiding: apiColumn.hideable,
        enableSorting: false, // Disable sorting for all columns by default
        headerAlign, // Pass the header alignment to the DataTable
      } as any)
    })
  }, [entity, apiColumns, adapter])
}

function getDefaultColumnAlignment(column: HttpTypes.AdminColumn): "left" | "center" | "right" {
  // Currency columns should be right-aligned
  if (column.semantic_type === "currency" || column.data_type === "currency") {
    return "right"
  }
  
  // Number columns should be right-aligned (except identifiers)
  if (column.data_type === "number" && column.context !== "identifier") {
    return "right"
  }
  
  // Total/amount/price columns should be right-aligned
  if (
    column.field.includes("total") ||
    column.field.includes("amount") ||
    column.field.includes("price") ||
    column.field.includes("quantity") ||
    column.field.includes("count")
  ) {
    return "right"
  }
  
  // Status columns should be center-aligned
  if (column.semantic_type === "status") {
    return "center"
  }
  
  // Country columns should be center-aligned
  if (column.computed?.type === "country_code" || 
      column.field === "country" || 
      column.field.includes("country_code")) {
    return "center"
  }
  
  // Default to left alignment
  return "left"
}