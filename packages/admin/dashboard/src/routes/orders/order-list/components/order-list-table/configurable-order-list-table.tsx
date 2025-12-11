import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { ConfigurableDataTable } from "../../../../../components/table/configurable-data-table"
import { useOrderTableAdapter } from "./order-table-adapter"

export const ConfigurableOrderListTable = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const orderAdapter = useOrderTableAdapter()

  const actions = [
    {
      label: t("actions.export"),
      to: `export${location.search}`,
    },
  ]

  return (
    <ConfigurableDataTable
      adapter={orderAdapter}
      heading={t("orders.domain")}
      layout="fill"
      actions={actions}
    />
  )
}
