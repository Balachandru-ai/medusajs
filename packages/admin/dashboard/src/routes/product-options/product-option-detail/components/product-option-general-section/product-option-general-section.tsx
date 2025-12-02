import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Badge, Container, Heading } from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteProductOptionAction } from "../../../common/hooks/use-delete-product-option-action.tsx"

export const ProductOptionGeneralSection = ({
  productOption,
}: {
  productOption: HttpTypes.AdminProductOption
}) => {
  const { t } = useTranslation()

  const handleDelete = useDeleteProductOptionAction(productOption)

  const sortedValues = useMemo(() => {
    if (!productOption.values) {
      return []
    }

    return [...productOption.values].sort((a: any, b: any) => {
      const rankA = a.rank ?? Number.MAX_VALUE
      const rankB = b.rank ?? Number.MAX_VALUE
      return rankA - rankB
    })
  }, [productOption.values])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{productOption.title}</Heading>
        <div className="flex items-center gap-x-2">
          <Badge size="xsmall" color="blue">
            {t(
              `general.${productOption.is_exclusive ? "exclusive" : "global"}`
            )}
          </Badge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    icon: <PencilSquare />,
                    to: "edit",
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div className="px-6 py-4">
        <ValuesDisplay values={sortedValues} />
      </div>
    </Container>
  )
}

const ValuesDisplay = ({ values }: { values: any[] }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((value) => (
        <Badge key={value.id} size="xsmall">
          {value.value}
        </Badge>
      ))}
    </div>
  )
}
