import { createRequire } from "node:module"
import outdent from "outdent"
import { generateModule } from "../utils"
import { generateI18n } from "../i18n"

const require = createRequire(import.meta.url)

export async function generateVirtualI18nModule(
  sources: Set<string>,
  pluginMode = false
) {
  const i18n = await generateI18n(sources)
  const adminSharedImport = require.resolve("@medusajs/admin-shared")
  const imports = [
    `import { deepMerge } from "${adminSharedImport}"`,
    ...i18n.imports,
  ]

  const code = outdent`
        ${imports.join("\n")}

        ${
          pluginMode
            ? `const i18nModule = { ${i18n.code} }`
            : `export default { ${i18n.code} }`
        }
    `

  return generateModule(code)
}
