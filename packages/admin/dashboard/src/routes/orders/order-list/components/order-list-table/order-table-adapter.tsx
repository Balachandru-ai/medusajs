import { HttpTypes } from "@medusajs/types"
import {
  createTableAdapter,
  TableAdapter,
} from "../../../../../lib/table/table-adapters"
import { useOrders } from "../../../../../hooks/api/orders"

/**
 * Create the order table adapter with all order-specific logic
 */
export function createOrderTableAdapter(): TableAdapter<HttpTypes.AdminOrder> {
  return createTableAdapter<HttpTypes.AdminOrder>({
    entity: "orders",
    queryPrefix: "o",
    pageSize: 20,
    resolveExcludedFilters: (columns) => {
      const FIELDS_TO_EXCLUDE = ["region_id", "customer_id", "sales_channel_id"]
      return columns
        .filter((column) => FIELDS_TO_EXCLUDE.includes(column.field))
        .map((column) => column.id)
    },

    useData: (fields, params) => {
      const { orders, count, isError, error, isLoading } = useOrders(
        {
          fields,
          ...params,
        },
        {
          placeholderData: (previousData, previousQuery) => {
            // Only keep placeholder data if the fields haven't changed
            const prevFields =
              previousQuery?.[previousQuery.length - 1]?.query?.fields
            if (prevFields && prevFields !== fields) {
              // Fields changed, don't use placeholder data
              return undefined
            }
            // Fields are the same, keep previous data for smooth transitions
            return previousData
          },
        }
      )

      return {
        data: orders,
        count,
        isLoading,
        isError,
        error,
      }
    },

    getRowHref: (row) => `/orders/${row.id}`,

    emptyState: {
      empty: {
        heading: "No orders found",
      },
    },
  })
}

export function useOrderTableAdapter(): TableAdapter<HttpTypes.AdminOrder> {
  return createOrderTableAdapter()
}
