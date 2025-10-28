import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge } from "@medusajs/ui"
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

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{productOption.title}</Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={productOption.is_exclusive ? "orange" : "green"}>
            {t(
              `general.${productOption.is_exclusive ? "exclusive" : "global"}`
            )}
          </StatusBadge>
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
    </Container>
  )
}
