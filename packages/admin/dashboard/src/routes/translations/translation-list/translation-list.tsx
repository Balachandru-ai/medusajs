import { Container, Heading, Text } from "@medusajs/ui"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useTranslation } from "react-i18next"
import { Buildings } from "@medusajs/icons"
import { useStore } from "../../../hooks/api"
import { ActiveLocalesSection } from "./components/active-locales-section/active-locales-section"
import { TranslationListSection } from "./components/translation-list-section/translation-list-section"
import { TranslationsCompletionSection } from "./components/translations-completion-section/translations-completion-section"
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"

export type TranslatableEntity = {
  icon: React.ReactNode
  label: string
  reference: string
  translatedCount?: number
  totalCount?: number
}

const TRANSLATABLE_ENTITIES: TranslatableEntity[] = [
  {
    icon: <Buildings />,
    label: "Product",
    reference: "product",
    translatedCount: 4,
    totalCount: 96,
  },
  {
    icon: <Buildings />,
    label: "Product Variants",
    reference: "product_variant",
    translatedCount: 4,
    totalCount: 200000,
  },
  {
    icon: <Buildings />,
    label: "Product Categories",
    reference: "product_category",
    translatedCount: 96,
    totalCount: 96,
  },
  {
    icon: <Buildings />,
    label: "Product Collections",
    reference: "product_collection",
    translatedCount: 4,
    totalCount: 96,
  },
  {
    icon: <Buildings />,
    label: "Product Types",
    reference: "product_type",
    translatedCount: 4,
    totalCount: 96,
  },
  {
    icon: <Buildings />,
    label: "Product Tags",
    reference: "product_tag",
    translatedCount: 96,
    totalCount: 96,
  },
  {
    icon: <Buildings />,
    label: "Product Options",
    reference: "product_option",
    translatedCount: 96,
    totalCount: 96,
  },
  {
    icon: <Buildings />,
    label: "Product Option Values",
    reference: "product_option_value",
    translatedCount: 96,
    totalCount: 96,
  },
]

export const TranslationList = () => {
  const { t } = useTranslation()

  const { store, isPending, isError, error } = useStore()

  if (isError) {
    throw error
  }

  const isReady = !!store && !isPending

  if (!isReady) {
    return <TwoColumnPageSkeleton sidebarSections={2} />
  }

  const hasLocales = (store?.supported_locales ?? []).length > 0

  return (
    <TwoColumnPage
      widgets={{
        before: [],
        after: [],
        sideBefore: [],
        sideAfter: [],
      }}
    >
      <TwoColumnPage.Main>
        <Container className="flex flex-col px-6 py-4">
          <Heading>Manage {t("translations.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("translations.subtitle")}
          </Text>
        </Container>
        <TranslationListSection
          entities={TRANSLATABLE_ENTITIES}
          hasLocales={hasLocales}
        />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ActiveLocalesSection
          locales={
            store?.supported_locales?.map(
              (suportedLocale) => suportedLocale.locale
            ) ?? []
          }
        ></ActiveLocalesSection>
        <TranslationsCompletionSection />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
