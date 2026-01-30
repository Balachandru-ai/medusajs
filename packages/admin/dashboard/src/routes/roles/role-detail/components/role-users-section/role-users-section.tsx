import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../../components/table/data-table"
import { useRbacRoleUsers } from "../../../../../hooks/api/rbac-roles"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useDate } from "../../../../../hooks/use-date"
import { useQueryParams } from "../../../../../hooks/use-query-params"

type RoleUsersSectionProps = {
  role: HttpTypes.AdminRbacRole
}

const PAGE_SIZE = 10

export const RoleUsersSection = ({ role }: RoleUsersSectionProps) => {
  const { t } = useTranslation()
  const { offset } = useQueryParams(["offset"])

  const {
    users,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useRbacRoleUsers(role.id, {
    limit: PAGE_SIZE,
    offset: offset ? parseInt(offset) : 0,
  })

  const columns = useColumns()

  const { table } = useDataTable({
    data: users ?? [],
    columns,
    count,
    getRowId: (row) => row.id,
    enablePagination: true,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("users.domain")}</Heading>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        count={count}
        navigateTo={(row) => `/settings/users/${row.original.id}`}
        pagination
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminUser>()

const useColumns = () => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  return useMemo(
    () => [
      columnHelper.accessor("first_name", {
        header: t("fields.firstName"),
        cell: ({ row }) => row.original.first_name || "-",
      }),
      columnHelper.accessor("last_name", {
        header: t("fields.lastName"),
        cell: ({ row }) => row.original.last_name || "-",
      }),
      columnHelper.accessor("email", {
        header: t("fields.email"),
        cell: ({ row }) => row.original.email,
      }),
      columnHelper.accessor("created_at", {
        header: t("fields.createdAt"),
        cell: ({ row }) => getFullDate({ date: row.original.created_at }),
      }),
    ],
    [t, getFullDate]
  )
}
