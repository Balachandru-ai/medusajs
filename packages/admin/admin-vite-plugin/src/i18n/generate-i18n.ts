import { deepMerge } from "@medusajs/admin-shared"
import { outdent } from "outdent"
import { pathToFileURL } from "url"
import { getI18nIndexFilesFromSources } from "./helpers"
import { logger } from "../logger"

export async function generateI18n(sources: Set<string>) {
    const indexFiles = await getI18nIndexFilesFromSources(sources)

    let translationsByLang: Record<string, any> = {}

    for (const file of indexFiles) {
        try {
            // Convert file path to file URL for dynamic import
            const fileUrl = pathToFileURL(file).href
            const module = await import(fileUrl)
            const translations = module.default || module

            translationsByLang = deepMerge(translationsByLang, translations)
        } catch (error) {
            logger.warn(`Failed to load translation index file`, { file, error })
        }
    }

    return generateCode(translationsByLang)
}

function generateCode(translationsByLang: Record<string, any>): string {
    const resources = JSON.stringify(translationsByLang, null, 2)
            .replace(/\n/g, '\n  ')
            .replace(/^/, '  ')
    
    return outdent`
        resources: ${resources}
    `
}

