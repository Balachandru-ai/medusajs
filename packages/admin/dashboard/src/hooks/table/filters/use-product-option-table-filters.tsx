import { useTranslation } from "react-i18next"
import { createDataTableFilterHelper } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useDataTableDateFilters } from "../../../components/data-table/helpers/general/use-data-table-date-filters.tsx"
import { useMemo } from "react"

const filterHelper = createDataTableFilterHelper<HttpTypes.AdminProductOption>()

export const useProductOptionTableFilters = () => {
  const { t } = useTranslation()
  const dateFilters = useDataTableDateFilters()

  return useMemo(
    () => [
      filterHelper.accessor("is_exclusive", {
        label: t("fields.exclusive"),
        type: "radio",
        options: [
          {
            label: t("fields.true"),
            value: "false",
          },
          {
            label: t("fields.false"),
            value: "true",
          },
        ],
      }),
      ...dateFilters,
    ],
    [dateFilters, t]
  )
}
