import { outdent } from "outdent"
import { normalizePath } from "../utils"
import { getI18nIndexFilesFromSources } from "./helpers"

export async function generateI18n(sources: Set<string>) {
    const indexFiles = await getI18nIndexFilesFromSources(sources)

    const imports = indexFiles.map((file, index) => {
        const normalizedPath = normalizePath(file)
        return `import i18nTranslations${index} from "${normalizedPath}"`
    })

    const mergeCode = indexFiles.length > 0
        ? `deepMerge(${indexFiles.map((_, index) => `i18nTranslations${index}`).join(', ')})`
        : '{}'

    const code = outdent`
        resources: ${mergeCode}
    `

    return {
        imports,
        code,
    }
}

