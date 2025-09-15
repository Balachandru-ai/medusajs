import React, { useState, ReactNode } from "react"
import { Container, Button } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { DataTable } from "../../data-table"
import { SaveViewDialog } from "../save-view-dialog"
import { SaveViewDropdown } from "./save-view-dropdown"
import { useTableConfiguration } from "../../../hooks/table/use-table-configuration"
import { useOrderTableQuery } from "../../../hooks/table/query/use-order-table-query"
import { useConfigurableTableColumns } from "../../../hooks/table/columns/use-configurable-table-columns"
import { getEntityAdapter } from "../../../lib/table/entity-adapters"
import { DataTableColumnDef, DataTableEmptyStateProps, DataTableFilter } from "@medusajs/ui"
import { TableAdapter } from "../../../lib/table/table-adapters"

export interface ConfigurableDataTableProps<TData> {
  // Use adapter pattern for entity-specific configuration
  adapter: TableAdapter<TData>

  // Optional overrides
  heading?: string
  subHeading?: string
  pageSize?: number
  queryPrefix?: string
  layout?: "fill" | "auto"
  actions?: ReactNode
}

// Legacy props interface for backward compatibility
export interface LegacyConfigurableDataTableProps<TData> {
  // Entity configuration
  entity: string
  entityName?: string

  // Data and columns
  data: TData[]
  columns: DataTableColumnDef<TData, any>[]
  filters?: DataTableFilter[]

  // Table configuration
  pageSize?: number
  queryPrefix?: string
  getRowId: (row: TData) => string
  rowHref?: (row: TData) => string

  // UI configuration
  heading?: string
  subHeading?: string
  emptyState?: DataTableEmptyStateProps

  // Loading and counts
  isLoading?: boolean
  rowCount?: number

  // Additional content
  actions?: ReactNode

  // Layout
  layout?: "fill" | "auto"
}

// Internal component that handles adapter mode
function ConfigurableDataTableWithAdapter<TData>({
  adapter,
  heading,
  subHeading,
  pageSize: pageSizeProp,
  queryPrefix: queryPrefixProp,
  layout = "fill",
  // actions, // Currently unused
}: ConfigurableDataTableProps<TData>) {
  const { t } = useTranslation()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [editingView, setEditingView] = useState<any>(null)

  const entity = adapter.entity
  const entityName = adapter.entityName
  const filters = adapter.filters || []
  const pageSize = pageSizeProp || adapter.pageSize || 20
  const queryPrefix = queryPrefixProp || adapter.queryPrefix || ""

  // Get table configuration (single source of truth)
  const {
    activeView,
    createView,
    updateView,
    isViewConfigEnabled,
    visibleColumns,
    columnOrder,
    currentColumns,
    setColumnOrder,
    handleColumnVisibilityChange,
    currentConfiguration,
    hasConfigurationChanged,
    handleClearConfiguration,
    isLoadingColumns,
    apiColumns,
    requiredFields,
  } = useTableConfiguration({
    entity,
    pageSize,
    queryPrefix,
    filters,
  })

  // Get query params for data fetching
  const { searchParams } = useOrderTableQuery({
    pageSize,
    prefix: queryPrefix,
  })

  // Fetch data using adapter
  const fetchResult = adapter.useData(requiredFields, searchParams)

  // Generate columns
  // Use adapter's column adapter if provided, otherwise fall back to entity adapter
  const columnAdapter = adapter.columnAdapter || getEntityAdapter(entity)
  const generatedColumns = useConfigurableTableColumns(entity, apiColumns || [], columnAdapter)
  const columns = (adapter.getColumns && apiColumns)
    ? adapter.getColumns(apiColumns)
    : generatedColumns

  // Handle errors
  if (fetchResult.isError) {
    throw fetchResult.error
  }

  // View save handlers
  const handleSaveAsDefault = async () => {
    try {
      if (activeView?.is_system_default) {
        await updateView.mutateAsync({
          name: activeView.name || null,
          configuration: {
            visible_columns: currentColumns.visible,
            column_order: currentColumns.order,
            filters: currentConfiguration.filters || {},
            sorting: currentConfiguration.sorting || null,
            search: currentConfiguration.search || "",
          }
        })
      } else {
        await createView.mutateAsync({
          name: "Default",
          is_system_default: true,
          set_active: true,
          configuration: {
            visible_columns: currentColumns.visible,
            column_order: currentColumns.order,
            filters: currentConfiguration.filters || {},
            sorting: currentConfiguration.sorting || null,
            search: currentConfiguration.search || "",
          }
        })
      }
    } catch (_) {
      // Error is handled by the hook
    }
  }

  const handleUpdateExisting = async () => {
    if (!activeView) return

    try {
      await updateView.mutateAsync({
        name: activeView.name,
        configuration: {
          visible_columns: currentColumns.visible,
          column_order: currentColumns.order,
          filters: currentConfiguration.filters || {},
          sorting: currentConfiguration.sorting || null,
          search: currentConfiguration.search || "",
        }
      })
    } catch (_) {
      // Error is handled by the hook
    }
  }

  const handleSaveAsNew = () => {
    setSaveDialogOpen(true)
    setEditingView(null)
  }

  // Filter bar content with save controls
  const filterBarContent = hasConfigurationChanged ? (
    <>
      <Button
        variant="secondary"
        size="small"
        type="button"
        onClick={handleClearConfiguration}
      >
        {t("actions.clear")}
      </Button>
      <SaveViewDropdown
        isDefaultView={activeView?.is_system_default || !activeView}
        currentViewId={activeView?.id}
        currentViewName={activeView?.name}
        onSaveAsDefault={handleSaveAsDefault}
        onUpdateExisting={handleUpdateExisting}
        onSaveAsNew={handleSaveAsNew}
      />
    </>
  ) : null

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={fetchResult.data || []}
        columns={columns}
        filters={filters}
        getRowId={adapter.getRowId || ((row: any) => row.id)}
        rowCount={fetchResult.count}
        enablePagination
        enableSearch
        pageSize={pageSize}
        isLoading={fetchResult.isLoading || isLoadingColumns}
        layout={layout}
        heading={heading || entityName || (entity ? t(`${entity}.domain` as any) : "")}
        subHeading={subHeading}
        enableColumnVisibility={isViewConfigEnabled}
        initialColumnVisibility={visibleColumns}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        enableViewSelector={isViewConfigEnabled}
        entity={entity}
        currentColumns={currentColumns}
        filterBarContent={filterBarContent}
        rowHref={adapter.getRowHref as ((row: any) => string) | undefined}
        emptyState={adapter.emptyState || {
          empty: {
            heading: t(`${entity}.list.noRecordsMessage` as any),
          }
        }}
        prefix={queryPrefix}
      />

      {saveDialogOpen && (
        <SaveViewDialog
          entity={entity}
          currentColumns={currentColumns}
          currentConfiguration={currentConfiguration}
          editingView={editingView}
          onClose={() => {
            setSaveDialogOpen(false)
            setEditingView(null)
          }}
          onSaved={() => {
            setSaveDialogOpen(false)
            setEditingView(null)
          }}
        />
      )}
    </Container>
  )
}

// Internal component that handles legacy mode
function ConfigurableDataTableLegacy<TData>(props: LegacyConfigurableDataTableProps<TData>) {
  const { t } = useTranslation()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [editingView, setEditingView] = useState<any>(null)

  const {
    entity,
    entityName,
    data,
    columns,
    filters = [],
    pageSize = 20,
    queryPrefix = "",
    getRowId,
    rowHref,
    heading,
    subHeading,
    emptyState,
    isLoading = false,
    rowCount = 0,
    // actions, // Currently unused
    layout = "fill",
  } = props

  // Get table configuration
  const {
    activeView,
    createView,
    updateView,
    isViewConfigEnabled,
    visibleColumns,
    columnOrder,
    currentColumns,
    setColumnOrder,
    handleColumnVisibilityChange,
    currentConfiguration,
    hasConfigurationChanged,
    handleClearConfiguration,
    isLoadingColumns,
  } = useTableConfiguration({
    entity,
    pageSize,
    queryPrefix,
    filters,
  })

  // View save handlers
  const handleSaveAsDefault = async () => {
    try {
      if (activeView?.is_system_default) {
        await updateView.mutateAsync({
          name: activeView.name || null,
          configuration: {
            visible_columns: currentColumns.visible,
            column_order: currentColumns.order,
            filters: currentConfiguration.filters || {},
            sorting: currentConfiguration.sorting || null,
            search: currentConfiguration.search || "",
          }
        })
      } else {
        await createView.mutateAsync({
          name: "Default",
          is_system_default: true,
          set_active: true,
          configuration: {
            visible_columns: currentColumns.visible,
            column_order: currentColumns.order,
            filters: currentConfiguration.filters || {},
            sorting: currentConfiguration.sorting || null,
            search: currentConfiguration.search || "",
          }
        })
      }
    } catch (_) {
      // Error is handled by the hook
    }
  }

  const handleUpdateExisting = async () => {
    if (!activeView) return

    try {
      await updateView.mutateAsync({
        name: activeView.name,
        configuration: {
          visible_columns: currentColumns.visible,
          column_order: currentColumns.order,
          filters: currentConfiguration.filters || {},
          sorting: currentConfiguration.sorting || null,
          search: currentConfiguration.search || "",
        }
      })
    } catch (_) {
      // Error is handled by the hook
    }
  }

  const handleSaveAsNew = () => {
    setSaveDialogOpen(true)
    setEditingView(null)
  }

  // Filter bar content with save controls
  const filterBarContent = hasConfigurationChanged ? (
    <>
      <Button
        variant="secondary"
        size="small"
        type="button"
        onClick={handleClearConfiguration}
      >
        {t("actions.clear")}
      </Button>
      <SaveViewDropdown
        isDefaultView={activeView?.is_system_default || !activeView}
        currentViewId={activeView?.id}
        currentViewName={activeView?.name}
        onSaveAsDefault={handleSaveAsDefault}
        onUpdateExisting={handleUpdateExisting}
        onSaveAsNew={handleSaveAsNew}
      />
    </>
  ) : null

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={data}
        columns={columns}
        filters={filters}
        getRowId={getRowId}
        rowCount={rowCount}
        enablePagination
        enableSearch
        pageSize={pageSize}
        isLoading={isLoading || isLoadingColumns}
        layout={layout}
        heading={heading || entityName || (entity ? t(`${entity}.domain` as any) : "")}
        subHeading={subHeading}
        enableColumnVisibility={isViewConfigEnabled}
        initialColumnVisibility={visibleColumns}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        enableViewSelector={isViewConfigEnabled}
        entity={entity}
        currentColumns={currentColumns}
        filterBarContent={filterBarContent}
        rowHref={rowHref}
        emptyState={emptyState || {
          empty: {
            heading: t(`${entity}.list.noRecordsMessage` as any),
          }
        }}
        prefix={queryPrefix}
      />

      {saveDialogOpen && (
        <SaveViewDialog
          entity={entity}
          currentColumns={currentColumns}
          currentConfiguration={currentConfiguration}
          editingView={editingView}
          onClose={() => {
            setSaveDialogOpen(false)
            setEditingView(null)
          }}
          onSaved={() => {
            setSaveDialogOpen(false)
            setEditingView(null)
          }}
        />
      )}
    </Container>
  )
}

// Main export that delegates to the appropriate component
export function ConfigurableDataTable<TData>(
  props: ConfigurableDataTableProps<TData> | LegacyConfigurableDataTableProps<TData>
) {
  // Check if using new adapter pattern or legacy props
  if ('adapter' in props) {
    return <ConfigurableDataTableWithAdapter<TData> {...props} />
  } else {
    return <ConfigurableDataTableLegacy<TData> {...props} />
  }
}
