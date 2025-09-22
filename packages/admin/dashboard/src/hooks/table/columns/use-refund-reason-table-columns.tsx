import { HttpTypes } from "@medusajs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

const columnHelper = createColumnHelper<HttpTypes.AdminRefundReason>()

export const useRefundReasonTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("label", {
        cell: ({ row }) => {
          const { label, description } = row.original
          return (
            <div className=" py-4">
              <div className="flex h-full w-full flex-col justify-center">
                <span className="truncate font-medium">{label}</span>
                <span className="truncate">
                  {description ? description : "-"}
                </span>
              </div>
            </div>
          )
        },
      }),
    ],
    []
  )
}
