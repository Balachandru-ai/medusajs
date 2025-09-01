import { Container, Heading } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"

import { DataTable } from "../../../../../components/data-table"
import { useOrders } from "../../../../../hooks/api/orders"
import { useOrderTableColumns } from "../../../../../hooks/table/columns/use-order-table-columns"
import { useOrderTableFilters } from "../../../../../hooks/table/filters/use-order-table-filters"
import { useOrderTableQuery } from "../../../../../hooks/table/query/use-order-table-query"

import { DEFAULT_FIELDS } from "../../const"

const PAGE_SIZE = 20

export const ConfigurableOrderListTable = () => {
  const { t } = useTranslation()
  
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [columnOrder, setColumnOrder] = useState<string[]>([])

  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { orders, count, isError, error, isLoading } = useOrders(
    {
      fields: DEFAULT_FIELDS,
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const filters = useOrderTableFilters()
  const columns = useOrderTableColumns({})

  const handleViewChange = (view: any) => {
    if (view) {
      // Apply view configuration
      const visibilityState: Record<string, boolean> = {}
      const allColumns = columns.map(c => c.id!)
      
      // Set all columns to hidden first
      allColumns.forEach(col => {
        visibilityState[col] = false
      })
      
      // Then show only the visible columns from the view
      if (view.configuration?.visible_columns) {
        view.configuration.visible_columns.forEach((col: string) => {
          visibilityState[col] = true
        })
      }
      
      setColumnVisibility(visibilityState)
      
      if (view.configuration?.column_order) {
        setColumnOrder(view.configuration.column_order)
      }
    } else {
      // Reset to default (all visible)
      setColumnVisibility({})
      setColumnOrder([])
    }
  }

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={orders ?? []}
        columns={columns}
        filters={filters}
        getRowId={(row) => row.id}
        rowCount={count}
        enablePagination
        enableSearch
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        layout="fill"
        heading={t("orders.domain")}
        enableColumnVisibility={true}
        initialColumnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        enableViewSelector={true}
        entity="orders"
        onViewChange={handleViewChange}
        currentColumns={{
          visible: Object.entries(columnVisibility)
            .filter(([_, visible]) => visible !== false)
            .map(([col]) => col),
          order: columnOrder.length > 0 ? columnOrder : columns.map(c => c.id!).filter(Boolean)
        }}
        rowHref={(row) => `/orders/${row.id}`}
        emptyState={{
          message: t("orders.list.noRecordsMessage"),
        }}
      />
    </Container>
  )
}