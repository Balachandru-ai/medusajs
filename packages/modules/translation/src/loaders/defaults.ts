import {
  LoaderOptions,
  Logger,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  normalizeLocale,
} from "@medusajs/framework/utils"
import Locale from "@models/locale"
import localesList from "./locales-list";

/**
 * BCP 47 Language Tags
 * Common language-region codes following the IETF BCP 47 standard.
 * Format: language[-script][-region]
 * Examples: "en-US" (English, United States), "zh-Hans-CN" (Chinese Simplified, China)
 */
const defaultLocales = localesList.locales;

export default async ({ container }: LoaderOptions): Promise<void> => {
  const logger =
    container.resolve<Logger>(ContainerRegistrationKeys.LOGGER) ?? console
  const localeService_: ModulesSdkTypes.IMedusaInternalService<typeof Locale> =
    container.resolve("localeService")

  try {
    // Fetch existing locales to map their IDs for upsert
    // The upsert method uses `id` as the key, so we need to include IDs for existing locales
    const existingLocales = await localeService_.list(
      {},
      { select: ["id", "code"] }
    )
    const existingByCode = new Map(
      existingLocales.map((l) => [l.code, l.id])
    )

    // Map default locales to include IDs for existing ones
    const localesToUpsert = defaultLocales.map((locale) => {
      const normalizedCode = normalizeLocale(locale.code)
      const existingId = existingByCode.get(normalizedCode)
      return existingId ? { ...locale, id: existingId } : locale
    })

    const resp = await localeService_.upsert(localesToUpsert)
    logger.debug(`Loaded ${resp.length} locales`)
  } catch (error) {
    logger.warn(
      `Failed to load locales, skipping loader. Original error: ${error.message}`
    )
  }
}
