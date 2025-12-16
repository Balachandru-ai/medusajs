import { AdminTranslationEntityStatistics, HttpTypes } from "@medusajs/types"
import { Container, Heading, Text, Tooltip } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

type TranslationsCompletionSectionProps = {
  statistics: Record<string, AdminTranslationEntityStatistics>
  locales: HttpTypes.AdminLocale[]
}

type LocaleStats = {
  code: string
  name: string
  translated: number
  toTranslate: number
  total: number
}

export const TranslationsCompletionSection = ({
  statistics,
  locales,
}: TranslationsCompletionSectionProps) => {
  const { t } = useTranslation()
  const [hoveredLocale, setHoveredLocale] = useState<string | null>(null)

  const { translatedCount, totalCount } = Object.values(statistics).reduce(
    (acc, curr) => ({
      translatedCount: acc.translatedCount + curr.translated,
      totalCount: acc.totalCount + curr.expected,
    }),
    { totalCount: 0, translatedCount: 0 }
  )

  const percentage = totalCount > 0 ? (translatedCount / totalCount) * 100 : 0
  const remaining = Math.max(0, totalCount - translatedCount)

  const localeStats = useMemo((): LocaleStats[] => {
    const localeMap = new Map<
      string,
      { translated: number; expected: number }
    >()

    locales.forEach((locale) => {
      localeMap.set(locale.code, { translated: 0, expected: 0 })
    })

    Object.values(statistics).forEach((entityStats) => {
      if (entityStats.by_locale) {
        Object.entries(entityStats.by_locale).forEach(
          ([localeCode, localeData]) => {
            const existing = localeMap.get(localeCode)
            if (existing) {
              existing.translated += localeData.translated
              existing.expected += localeData.expected
            }
          }
        )
      }
    })

    return locales.map((locale) => {
      const stats = localeMap.get(locale.code) || { translated: 0, expected: 0 }
      return {
        code: locale.code,
        name: locale.name,
        translated: stats.translated,
        toTranslate: Math.max(0, stats.expected - stats.translated),
        total: stats.expected,
      }
    })
  }, [statistics, locales])

  const maxTotal = useMemo(
    () => Math.max(...localeStats.map((s) => s.total), 1),
    [localeStats]
  )

  return (
    <Container className="flex flex-col gap-y-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading>{t("translations.completion.heading")}</Heading>
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          {translatedCount.toLocaleString()} {t("general.of")}{" "}
          {totalCount.toLocaleString()}
        </Text>
      </div>

      <div className="flex h-3 w-full overflow-hidden">
        {percentage > 0 ? (
          <>
            <div
              className="mr-0.5 h-full rounded-sm transition-all"
              style={{
                width: `${percentage}%`,
                backgroundColor: "var(--bg-interactive)",
              }}
            />
            <div
              className="h-full flex-1 rounded-sm"
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
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          {percentage.toFixed(1)}%
        </Text>
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          {remaining.toLocaleString()} {t("general.remaining").toLowerCase()}
        </Text>
      </div>

      {localeStats.length > 0 && (
        <div className="mt-4 flex flex-col gap-y-2">
          <div className="flex h-32 w-full items-end gap-1">
            {localeStats.map((locale) => {
              const heightPercent = (locale.total / maxTotal) * 100
              const translatedPercent =
                locale.total > 0 ? (locale.translated / locale.total) * 100 : 0

              return (
                <Tooltip
                  key={locale.code}
                  open={hoveredLocale === locale.code}
                  content={
                    <div className="flex flex-col gap-y-1 p-1">
                      <Text size="small" weight="plus">
                        {locale.name}
                      </Text>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: "var(--bg-interactive)" }}
                          />
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            {t("translations.completion.translated")}
                          </Text>
                        </div>
                        <Text size="xsmall" weight="plus">
                          {locale.translated}
                        </Text>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: "var(--bg-interactive)",
                            opacity: 0.3,
                          }}
                        />
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {t("translations.completion.toTranslate")}
                        </Text>
                        <Text size="xsmall" weight="plus">
                          {locale.toTranslate}
                        </Text>
                      </div>
                    </div>
                  }
                >
                  <div
                    className="flex min-w-2 flex-1 cursor-pointer flex-col justify-end overflow-hidden rounded-t-sm transition-opacity"
                    style={{ height: `${heightPercent}%` }}
                    onMouseEnter={() => setHoveredLocale(locale.code)}
                    onMouseLeave={() => setHoveredLocale(null)}
                  >
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${100 - translatedPercent}%`,
                        backgroundColor: "var(--bg-interactive)",
                        opacity: 0.3,
                        minHeight: locale.toTranslate > 0 ? "2px" : "0",
                      }}
                    />
                    {translatedPercent > 0 && (
                      <div
                        className="mt-0.5 w-full rounded-sm"
                        style={{
                          height: `${translatedPercent}%`,
                          backgroundColor: "var(--bg-interactive)",
                          minHeight: locale.translated > 0 ? "2px" : "0",
                        }}
                      />
                    )}
                  </div>
                </Tooltip>
              )
            })}
          </div>
          <Text size="xsmall" className="text-ui-fg-muted text-center">
            {t("translations.completion.footer")}
          </Text>
        </div>
      )}
    </Container>
  )
}
