import React, { useMemo } from "react"
import { createDataTableColumnHelper } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { getDisplayStrategy, getEntityAccessor } from "../../../lib/table-display-utils"

export interface ColumnAdapter<TData> {
  getColumnAlignment?: (column: HttpTypes.AdminViewColumn) => "left" | "center" | "right"
  getCustomAccessor?: (field: string, column: HttpTypes.AdminViewColumn) => any
  transformCellValue?: (value: any, row: TData, column: HttpTypes.AdminViewColumn) => React.ReactNode
}

export function useConfigurableTableColumns<TData = any>(
  entity: string,
  apiColumns: HttpTypes.AdminViewColumn[] | undefined,
  adapter?: ColumnAdapter<TData>
) {
  const columnHelper = createDataTableColumnHelper<TData>()

  return useMemo(() => {
    if (!apiColumns?.length) {
      return []
    }

    return apiColumns.map(apiColumn => {
      // Get the display strategy for this column
      const displayStrategy = getDisplayStrategy(apiColumn)

      // Get the entity-specific accessor or use adapter's custom accessor
      const accessor = adapter?.getCustomAccessor
        ? adapter.getCustomAccessor(apiColumn.field, apiColumn)
        : getEntityAccessor(entity, apiColumn.field, apiColumn)

      // Determine header alignment
      const headerAlign = adapter?.getColumnAlignment
        ? adapter.getColumnAlignment(apiColumn)
        : getDefaultColumnAlignment(apiColumn)

      return columnHelper.accessor(accessor, {
        id: apiColumn.field,
        header: () => apiColumn.name,
        cell: ({ getValue, row }) => {
          const value = getValue()

          // If the value is already a React element (from computed columns), return it directly
          if (React.isValidElement(value)) {
            return value
          }

          // Allow adapter to transform the value
          if (adapter?.transformCellValue) {
            return adapter.transformCellValue(value, row.original, apiColumn)
          }

          // Otherwise, use the display strategy to format the value
          return displayStrategy(value, row.original)
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

function getDefaultColumnAlignment(column: HttpTypes.AdminViewColumn): "left" | "center" | "right" {
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