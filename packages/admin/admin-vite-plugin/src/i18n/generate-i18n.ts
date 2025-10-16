import { deepMerge } from "@medusajs/admin-shared"
import { outdent } from "outdent"
import { pathToFileURL } from "url"
import { getI18nIndexFilesFromSources } from "./helpers"
import { logger } from "../logger"

export async function generateI18n(sources: Set<string>) {
    const indexFiles = await getI18nIndexFilesFromSources(sources)

    const translationsByLang: Record<string, any> = {}

    for (const file of indexFiles) {
        try {
            // Convert file path to file URL for dynamic import
            const fileUrl = pathToFileURL(file).href
            const module = await import(fileUrl)
            const translations = module.default || module

            for (const [langCode, langResources] of Object.entries(translations)) {
                if (!translationsByLang[langCode]) {
                    translationsByLang[langCode] = {}
                }

                translationsByLang[langCode] = deepMerge(
                    translationsByLang[langCode],
                    langResources as any
                )
            }
        } catch (error) {
            logger.warn(`Failed to load translation index file`, { file, error })
        }
    }

    return generateCode(translationsByLang)
}

function generateCode(translationsByLang: Record<string, any>): string {
    const resourcesCode = Object.entries(translationsByLang)
        .map(([lang, resources]) => {
            return `  "${lang}": ${JSON.stringify(resources, null, 4).split("\n").join("\n  ")}`
        })
        .join(",\n")

    return outdent`
        resources: {
        ${resourcesCode}
        }
    `
}

