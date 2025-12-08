import { Button, Container, Heading, Text } from "@medusajs/ui"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { Buildings, Pencil } from "@medusajs/icons"
import { IconAvatar } from "../../../components/common/icon-avatar/icon-avatar"
import { ActionMenu } from "../../../components/common/action-menu"
import { LinkButton } from "../../../components/common/link-button/link-button"

type TranslatableEntity = {
  icon: React.ReactNode
  label: string
  reference: string
}

const TRANSLATABLE_ENTITIES: TranslatableEntity[] = [
  {
    icon: <Buildings />,
    label: "Product",
    reference: "product",
  },
  {
    icon: <Buildings />,
    label: "Product Variants",
    reference: "product_variant",
  },
  {
    icon: <Buildings />,
    label: "Product Categories",
    reference: "product_category",
  },
  {
    icon: <Buildings />,
    label: "Product Collections",
    reference: "product_collection",
  },
  {
    icon: <Buildings />,
    label: "Product Types",
    reference: "product_type",
  },
  {
    icon: <Buildings />,
    label: "Product Tags",
    reference: "product_tag",
  },
  {
    icon: <Buildings />,
    label: "Product Options",
    reference: "product_option",
  },
  {
    icon: <Buildings />,
    label: "Product Option Values",
    reference: "product_option_value",
  },
]

export const TranslationList = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleManageLocales = () => {
    navigate("/settings/store/locales")
  }

  return (
    <SingleColumnPage
      widgets={{
        before: [],
        after: [],
      }}
    >
      <Container className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Manage {t("translations.domain")}</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {t("translations.subtitle")}
            </Text>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={handleManageLocales}
          >
            {t("translations.actions.manageLocales")}
          </Button>
        </div>
      </Container>
      {TRANSLATABLE_ENTITIES.map((entity) => (
        <Container key={entity.label} className="p-0">
          <div className="flex items-center justify-between px-6 py-3">
            <Link
              to={`/settings/translations/edit?reference=${entity.reference}`}
              className="transition-fg hover:bg-ui-bg-base-hover active:bg-ui-bg-base-pressed focus-visible:shadow-borders-interactive-with-active -mx-2 flex flex-1 items-center gap-x-2 rounded-md px-2 py-1.5 outline-none"
            >
              <IconAvatar variant="squared">{entity.icon}</IconAvatar>
              <Text size="small">{entity.label}</Text>
            </Link>
            <div className="flex items-center gap-x-2">
              <ActionMenu
                groups={[
                  {
                    actions: [
                      {
                        icon: <Pencil />,
                        label: t("actions.edit"),
                        onClick: () => {
                          navigate(
                            `/settings/translations/edit?reference=${entity.label.toLowerCase()}`
                          )
                        },
                      },
                    ],
                  },
                ]}
              ></ActionMenu>
              <Text>|</Text>
              <LinkButton
                to={`/settings/translations/${entity.label.toLowerCase()}`}
              >
                {t("actions.viewDetails")}
              </LinkButton>
            </div>
          </div>
        </Container>
      ))}
    </SingleColumnPage>
  )
}
