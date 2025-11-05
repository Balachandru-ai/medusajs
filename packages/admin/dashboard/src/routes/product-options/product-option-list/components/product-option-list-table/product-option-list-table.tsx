import { Container, createDataTableColumnHelper, toast, usePrompt, } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { DataTable } from "../../../../../components/data-table"

import { keepPreviousData } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { useDeleteProductOptionLazy, useProductOptions, } from "../../../../../hooks/api/product-options"
import { useProductOptionTableColumns } from "../../../../../hooks/table/columns/use-product-option-table-columns"
import { useProductOptionTableFilters } from "../../../../../hooks/table/filters"
import { useProductOptionTableQuery } from "../../../../../hooks/table/query/use-product-option-table-query"
import { HttpTypes } from "@medusajs/types"
import { useNavigate } from "react-router-dom"
import { PencilSquare, Trash } from "@medusajs/icons"

const PAGE_SIZE = 20

export const ProductOptionListTable = () => {
  const { t } = useTranslation()

  const { searchParams } = useProductOptionTableQuery({
    pageSize: PAGE_SIZE,
  })
  const { product_options, count, isError, error, isLoading } =
    useProductOptions(searchParams, {
      placeholderData: keepPreviousData,
    })

  const filters = useProductOptionTableFilters()
  const columns = useColumns()

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={product_options}
        columns={columns}
        filters={filters}
        rowCount={count}
        pageSize={PAGE_SIZE}
        getRowId={(row) => row.id}
        heading={t("productOptions.domain")}
        subHeading={t("productOptions.subtitle")}
        emptyState={{
          empty: {
            heading: t("general.noRecordsMessage"),
          },
          filtered: {
            heading: t("general.noRecordsMessage"),
            description: t("general.noRecordsMessageFiltered"),
          },
        }}
        actions={[
          {
            label: t("actions.create"),
            to: "create",
          },
        ]}
        isLoading={isLoading}
        enableSearch={true}
        rowHref={(row) => `/product-options/${row.id}`}
      />
    </Container>
  )
}

const columnHelper = createDataTableColumnHelper<HttpTypes.AdminProductOption>()

const useColumns = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const base = useProductOptionTableColumns()

  const { mutateAsync } = useDeleteProductOptionLazy()

  const handleDelete = useCallback(
    async (productOption: HttpTypes.AdminProductOption) => {
      const confirm = await prompt({
        title: t("general.areYouSure"),
        description: t("productOptions.delete.confirmation", {
          title: productOption.title,
        }),
        confirmText: t("actions.delete"),
        cancelText: t("actions.cancel"),
      })

      if (!confirm) {
        return
      }

      await mutateAsync(productOption.id, {
        onSuccess: () => {
          toast.success(t("productOptions.delete.successToast"))
        },
        onError: (e) => {
          toast.error(e.message)
        },
      })
    },
    [t, prompt, mutateAsync]
  )

  return useMemo(
    () => [
      ...base,
      columnHelper.action({
        actions: (ctx) => [
          [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              onClick: () =>
                navigate(`/product-options/${ctx.row.original.id}/edit`),
            },
          ],
          [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: () => handleDelete(ctx.row.original),
            },
          ],
        ],
      }),
    ],
    [base, handleDelete, navigate, t]
  )
}
