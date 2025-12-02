import { HttpTypes } from "@medusajs/types"
import { useQueryParams } from "../../use-query-params"

type UseProductOptionTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useProductOptionTableQuery = ({
  prefix,
  pageSize = 20,
}: UseProductOptionTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "order", "created_at", "updated_at", "is_exclusive"],
    prefix
  )

  const { offset, created_at, updated_at, q, order, is_exclusive } = queryObject

  const searchParams: HttpTypes.AdminProductOptionListParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    is_exclusive: is_exclusive === "true" ? true : is_exclusive === "false" ? false : undefined,
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}