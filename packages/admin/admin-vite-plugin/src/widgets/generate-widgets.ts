import { InjectionZone, isValidInjectionZone } from "@medusajs/admin-shared"
import fs from "fs/promises"
import outdent from "outdent"
import {
  File,
  isArrayExpression,
  isIdentifier,
  isNumericLiteral,
  isObjectProperty,
  isStringLiteral,
  isTemplateLiteral,
  isUnaryExpression,
  Node,
  ObjectProperty,
  parse,
  ParseResult,
  traverse,
} from "../babel"
import { logger } from "../logger"
import { getParserOptions, hasDefaultExport, normalizePath } from "../utils"
import { getWidgetFilesFromSources } from "./helpers"

type WidgetConfig = {
  Component: string
  zone: InjectionZone[]
  rank?: number
}

type ParsedWidgetConfig = {
  import: string
  widget: WidgetConfig
}

export async function generateWidgets(sources: Set<string>) {
  const files = await getWidgetFilesFromSources(sources)
  const results = await getWidgetResults(files)

  const imports = results.map((r) => r.import)
  const code = generateCode(results)

  return {
    imports,
    code,
  }
}

async function getWidgetResults(
  files: string[]
): Promise<ParsedWidgetConfig[]> {
  return (await Promise.all(files.map(parseFile))).filter(
    (r) => r !== null
  ) as ParsedWidgetConfig[]
}

function generateCode(results: ParsedWidgetConfig[]): string {
  return outdent`
    widgets: [
      ${results.map((r) => formatWidget(r.widget)).join(",\n")}
    ]
  `
}

function formatWidget(widget: WidgetConfig): string {
  return outdent`
    {
        Component: ${widget.Component},
        zone: [${widget.zone.map((z) => `"${z}"`).join(", ")}],
        rank: ${widget.rank !== undefined ? widget.rank : "undefined"}
    }
  `
}

async function parseFile(
  file: string,
  index: number
): Promise<ParsedWidgetConfig | null> {
  const code = await fs.readFile(file, "utf-8")
  let ast: ParseResult<File>

  try {
    ast = parse(code, getParserOptions(file))
  } catch (e) {
    logger.error(`An error occurred while parsing the file.`, {
      file,
      error: e,
    })
    return null
  }

  let fileHasDefaultExport = false

  try {
    fileHasDefaultExport = await hasDefaultExport(ast)
  } catch (e) {
    logger.error(`An error occurred while checking for a default export.`, {
      file,
      error: e,
    })
    return null
  }

  if (!fileHasDefaultExport) {
    return null
  }

  let widgetConfig: { zone: InjectionZone[]; rank?: number } | null

  try {
    widgetConfig = await getWidgetConfig(ast, file)
  } catch (e) {
    logger.error(`An error occurred while traversing the file.`, {
      file,
      error: e,
    })
    return null
  }

  if (!widgetConfig) {
    return null
  }

  const import_ = generateImport(file, index)
  const widget = generateWidget(widgetConfig.zone, widgetConfig.rank, index)

  return {
    widget,
    import: import_,
  }
}

function generateWidgetComponentName(index: number): string {
  return `WidgetComponent${index}`
}

function generateWidgetConfigName(index: number): string {
  return `WidgetConfig${index}`
}

function generateImport(file: string, index: number): string {
  const path = normalizePath(file)
  return `import ${generateWidgetComponentName(
    index
  )}, { config as ${generateWidgetConfigName(index)} } from "${path}"`
}

function generateWidget(
  zone: InjectionZone[],
  rank: number | undefined,
  index: number
): WidgetConfig {
  return {
    Component: generateWidgetComponentName(index),
    zone: zone,
    rank: rank,
  }
}

async function getWidgetConfig(
  ast: ParseResult<File>,
  file: string
): Promise<{ zone: InjectionZone[]; rank?: number } | null> {
  const zones: string[] = []
  let rank: number | undefined

  /**
   * We need to keep track of whether we have found a zone in the file.
   * This is to avoid processing the same config both using the `ExportNamedDeclaration`
   * and `VariableDeclarator` paths, which would be the case for the unbundled files.
   */
  let zoneFound = false

  traverse(ast, {
    /**
     * In case we are processing a bundled file, the `config` will most likely
     * not be a named export. Instead we look for a `VariableDeclaration` named
     * `config` and extract the `zone` property from it.
     */
    VariableDeclarator(path) {
      if (zoneFound) {
        return
      }

      if (
        path.node.id.type === "Identifier" &&
        path.node.id.name === "config" &&
        path.node.init?.type === "CallExpression"
      ) {
        const arg = path.node.init.arguments[0]
        if (arg?.type === "ObjectExpression") {
          const zoneProperty = arg.properties.find(
            (p: any) => p.type === "ObjectProperty" && p.key.name === "zone"
          )
          if (zoneProperty?.type === "ObjectProperty") {
            extractZoneValues(zoneProperty.value, zones, file)
            rank = extractRankValue(arg.properties)
            zoneFound = true
          }
        }
      }
    },
    /**
     * For unbundled files, the `config` will always be a named export.
     */
    ExportNamedDeclaration(path) {
      if (zoneFound) {
        return
      }

      const declaration = path.node.declaration
      if (
        declaration?.type === "VariableDeclaration" &&
        declaration.declarations[0]?.type === "VariableDeclarator" &&
        declaration.declarations[0].id.type === "Identifier" &&
        declaration.declarations[0].id.name === "config" &&
        declaration.declarations[0].init?.type === "CallExpression"
      ) {
        const arg = declaration.declarations[0].init.arguments[0]
        if (arg?.type === "ObjectExpression") {
          const zoneProperty = arg.properties.find(
            (p: any) => p.type === "ObjectProperty" && p.key.name === "zone"
          )
          if (zoneProperty?.type === "ObjectProperty") {
            extractZoneValues(zoneProperty.value, zones, file)
            rank = extractRankValue(arg.properties)
            zoneFound = true
          }
        }
      }
    },
  })

  if (!zoneFound) {
    logger.warn(`'zone' property is missing from the widget config.`, { file })
    return null
  }

  const validatedZones = zones.filter(isValidInjectionZone)

  if (validatedZones.length === 0) {
    logger.warn(`'zone' property is not a valid injection zone.`, {
      file,
    })
    return null
  }

  return { zone: validatedZones, rank }
}

function extractRankValue(properties: Node[]): number | undefined {
  const rankProp = properties.find(
    (p) => isObjectProperty(p) && isIdentifier(p.key, { name: "rank" })
  ) as ObjectProperty | undefined

  if (!rankProp) {
    return undefined
  }

  // Handle positive numbers (e.g., rank: 5)
  if (isNumericLiteral(rankProp.value)) {
    return rankProp.value.value
  }

  // Handle negative numbers (e.g., rank: -1)
  // Negative numbers are parsed as UnaryExpression with operator "-"
  if (
    isUnaryExpression(rankProp.value) &&
    rankProp.value.operator === "-" &&
    isNumericLiteral(rankProp.value.argument)
  ) {
    return -rankProp.value.argument.value
  }

  return undefined
}

function extractZoneValues(value: Node, zones: string[], file: string) {
  if (isTemplateLiteral(value)) {
    logger.warn(
      `'zone' property cannot be a template literal (e.g. \`product.details.after\`).`,
      { file }
    )
    return
  }

  if (isStringLiteral(value)) {
    zones.push(value.value)
  } else if (isArrayExpression(value)) {
    const values = value.elements
      .filter((e) => isStringLiteral(e))
      .map((e) => e.value)
    zones.push(...values)
  } else {
    logger.warn(`'zone' property is not a string or array.`, { file })
    return
  }
}
