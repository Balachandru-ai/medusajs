import { generateModule } from "../utils"
import { generateI18n } from "../i18n"

export async function generateVirtualI18nModule(
    sources: Set<string>,
    pluginMode = false
) {
    const customI18n = await generateI18n(sources)
    
    const code = pluginMode
        ? `const i18nModule = { ${customI18n} }`
        : `export default { ${customI18n} }`

    return generateModule(code)
}

