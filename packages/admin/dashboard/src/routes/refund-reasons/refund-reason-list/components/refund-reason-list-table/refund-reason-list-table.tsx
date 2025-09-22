import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useRefundReasons } from "../../../../../hooks/api"
import { useRefundReasonTableColumns } from "../../../../../hooks/table/columns"
import { useRefundReasonTableQuery } from "../../../../../hooks/table/query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useDeleteRefundReasonAction } from "../../../common/hooks/use-delete-refund-reason-action"

const PAGE_SIZE = 20

export const RefundReasonListTable = () => {
  const { t } = useTranslation()
  const { searchParams, raw } = useRefundReasonTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { refund_reasons, count, isPending, isError, error } = useRefundReasons(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: refund_reasons,
    columns,
    count,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y px-0 py-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("refundReasons.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("refundReasons.subtitle")}
          </Text>
        </div>
        <Button variant="secondary" size="small" asChild>
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      </div>
      <_DataTable
        table={table}
        queryObject={raw}
        count={count}
        isLoading={isPending}
        columns={columns}
        pageSize={PAGE_SIZE}
        noHeader={true}
        pagination
        search
      />
    </Container>
  )
}

type RefundReasonRowActionsProps = {
  refundReason: HttpTypes.AdminRefundReason
}

const RefundReasonRowActions = ({
  refundReason,
}: RefundReasonRowActionsProps) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteRefundReasonAction(refundReason.id)

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `${refundReason.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminRefundReason>()

const useColumns = () => {
  const base = useRefundReasonTableColumns()

  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <RefundReasonRowActions refundReason={row.original} />
        ),
      }),
    ],
    [base]
  )
}
