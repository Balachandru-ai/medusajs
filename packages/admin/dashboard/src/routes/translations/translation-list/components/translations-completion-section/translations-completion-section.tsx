import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

type TranslationsCompletionSectionProps = {
  translatedCount?: number
  totalCount?: number
}

export const TranslationsCompletionSection = ({
  translatedCount = 0,
  totalCount = 0,
}: TranslationsCompletionSectionProps) => {
  const { t } = useTranslation()

  const percentage = totalCount > 0 ? (translatedCount / totalCount) * 100 : 0
  const remaining = Math.max(0, totalCount - translatedCount)

  return (
    <Container className="flex flex-col gap-y-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading>{t("translations.completion.heading")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {translatedCount.toLocaleString()} {t("general.of")}{" "}
          {totalCount.toLocaleString()}
        </Text>
      </div>

      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {percentage > 0 ? (
          <>
            <div
              className="mr-0.5 h-full rounded-l-full transition-all"
              style={{
                width: `${percentage}%`,
                backgroundColor: "var(--bg-interactive)",
              }}
            />
            <div
              className="h-full flex-1 rounded-r-full"
              style={{
                backgroundColor: "var(--bg-interactive)",
                opacity: 0.3,
              }}
            />
          </>
        ) : (
          <div
            className="h-full w-full rounded-full"
            style={{
              backgroundColor: "var(--bg-interactive)",
              opacity: 0.3,
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <Text size="small" className="text-ui-fg-subtle">
          {percentage.toFixed(1)}%
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          {remaining.toLocaleString()} {t("general.remaining").toLowerCase()}
        </Text>
      </div>
    </Container>
  )
}
