import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"

type ProductOptionValuesSectionProps = {
  productOption: HttpTypes.AdminProductOption
}

export const ProductOptionValuesSection = ({
  productOption,
}: ProductOptionValuesSectionProps) => {
  const { t } = useTranslation()

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
        <Heading level="h2">{t("productOptions.values.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.organize"),
                  icon: <PencilSquare />,
                  to: `values/organize`,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="px-6 py-4">
        <ValuesDisplay values={sortedValues} />
      </div>
    </Container>
  )
}

const ValuesDisplay = ({ values }: { values: any[] }) => {
  const { t } = useTranslation()

  if (!values.length) {
    return (
      <Text size="small" leading="compact">
        -
      </Text>
    )
  }

  return (
    <div className="flex w-full flex-col divide-y">
      {values.map((value, index) => (
        <div
          key={value.id}
          className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-2">
            <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">
              {index + 1}.
            </Text>
            <Badge size="2xsmall" className="max-w-full">
              <span className="truncate">{value.value}</span>
            </Badge>
          </div>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <Trash />,
                    label: t("actions.remove"),
                    onClick: () => {
                      // TODO: Implement remove value functionality
                      console.log("Remove value:", value.id)
                    },
                  },
                ],
              },
            ]}
          />
        </div>
      ))}
    </div>
  )
}
