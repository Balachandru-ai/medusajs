#!/usr/bin/env node

/**
 * Barrel File Removal Script v2
 *
 * This script removes barrel files (index.ts files that only re-export)
 * and replaces module path aliases (@alias) with hash imports (#alias).
 *
 * Usage:
 *   node remove-barrel-files-v2.js                          # Process all packages in packages/modules
 *   node remove-barrel-files-v2.js package1 package2        # Process specific packages in packages/modules
 *   node remove-barrel-files-v2.js packages/core            # Process all packages in packages/core
 *   node remove-barrel-files-v2.js packages/core package1   # Process specific packages in packages/core
 *
 * Features:
 *   - Works on any packages directory (not just packages/modules)
 *   - Validates that relative imports are properly replaced with hash imports
 *   - Reports any unreplaced relative imports or invalid hash imports
 *   - Updates package.json with "imports" field for hash imports
 *   - Updates tsconfig.json to remove path aliases
 *   - Runs prettier, eslint, builds, and tests
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const DEFAULT_PACKAGES_DIR = path.join(__dirname, "../packages/modules")
const PACKAGES_TO_SKIP = ["index", "providers"]

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
}

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Check if a file is a barrel file (only contains export statements)
 */
function isBarrelFile(filePath) {
  if (!fs.existsSync(filePath)) return false

  const content = fs.readFileSync(filePath, "utf8")
  const lines = content
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("//"))

  return (
    lines.length > 0 &&
    lines.every(
      (line) =>
        line.trim().startsWith("export ") ||
        line.trim() === "" ||
        line.trim().startsWith("/*") ||
        line.trim().startsWith("*") ||
        line.trim().startsWith("*/")
    )
  )
}

/**
 * Extract all exports from a TypeScript file
 */
function extractExportsFromFile(filePath) {
  if (!fs.existsSync(filePath))
    return { namedExports: [], hasDefaultExport: false }

  const content = fs.readFileSync(filePath, "utf8")
  const namedExports = []
  let hasDefaultExport = false

  // Check for default export
  if (
    /export\s+default\s+/.test(content) ||
    /export\s*\{[^}]*\s+as\s+default\s*\}/.test(content)
  ) {
    hasDefaultExport = true
  }

  // Match: export const/let/var/function/class/interface/type/enum Name
  const namedExportRegex =
    /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g
  let match
  while ((match = namedExportRegex.exec(content)) !== null) {
    namedExports.push(match[1])
  }

  // Match: export { Name1, Name2 } (but not re-exports with "from")
  const exportListRegex = /export\s*\{([^}]+)\}(?!\s+from)/g
  while ((match = exportListRegex.exec(content)) !== null) {
    const names = match[1].split(",").map((s) => {
      const cleaned = s.trim().replace(/^type\s+/, "")
      const parts = cleaned.split(/\s+as\s+/)
      return parts[parts.length - 1].trim()
    })
    namedExports.push(
      ...names.filter((n) => n && n !== "default" && n !== "type")
    )
  }

  return { namedExports, hasDefaultExport }
}

/**
 * Build a comprehensive export map by scanning all source files
 * Returns: { exportName: "relative/path/to/file" }
 */
function buildExportMap(modulePath) {
  const exportMap = {}
  const srcPath = path.join(modulePath, "src")

  // First pass: scan all non-index files
  function scanDirectory(dirPath, relativePathFromSrc = "") {
    if (!fs.existsSync(dirPath)) return

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.name.includes("__tests__")
      ) {
        continue
      }

      const fullPath = path.join(dirPath, entry.name)
      const newRelPath = relativePathFromSrc
        ? `${relativePathFromSrc}/${entry.name}`
        : entry.name

      if (entry.isDirectory()) {
        scanDirectory(fullPath, newRelPath)
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".ts") &&
        entry.name !== "index.ts"
      ) {
        const fileWithoutExt = entry.name.replace(/\.ts$/, "")
        const fileRelPath = relativePathFromSrc
          ? `${relativePathFromSrc}/${fileWithoutExt}`
          : fileWithoutExt

        const { namedExports, hasDefaultExport } =
          extractExportsFromFile(fullPath)

        // Map each named export to this file
        for (const exportName of namedExports) {
          if (!exportMap[exportName]) {
            exportMap[exportName] = fileRelPath
          }
        }

        // For default exports, also map PascalCase version of filename
        if (hasDefaultExport) {
          const defaultName = fileWithoutExt
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("")
          if (!exportMap[defaultName]) {
            exportMap[defaultName] = fileRelPath
          }
        }
      }
    }
  }

  // Second pass: process removable barrel files and add their export mappings
  function processBarrelFiles() {
    const { barrelDirectories } = detectImportDirectories(modulePath)
    const removableBarrels = getRemovableBarrelFiles(
      modulePath,
      barrelDirectories
    )

    for (const dir of removableBarrels) {
      const barrelPath = path.join(srcPath, dir, "index.ts")
      if (!fs.existsSync(barrelPath)) continue

      const content = fs.readFileSync(barrelPath, "utf8")

      // Parse: export { default as Name } from "./file"
      const exportDefaultRegex =
        /export\s*\{\s*default(?:\s+as\s+(\w+))?\s*\}\s*from\s*['"]\.\/([\w-]+)['"]/g
      let match

      while ((match = exportDefaultRegex.exec(content)) !== null) {
        const exportName = match[1]
        const fileName = match[2]
        const sourceFile = `${dir}/${fileName}`

        if (exportName) {
          // Has explicit "as Name" - use that name
          exportMap[exportName] = sourceFile
        } else {
          // No "as", use PascalCase of filename
          const defaultName = fileName
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("")
          exportMap[defaultName] = sourceFile
        }
      }

      // Parse: export * from "./file" - need to resolve the actual exports
      const exportStarRegex = /export\s+\*\s+from\s+['"]\.\/([\w-/]+)['"]/g
      while ((match = exportStarRegex.exec(content)) !== null) {
        const fileName = match[1]
        const sourceFilePath = path.join(srcPath, dir, `${fileName}.ts`)

        if (fs.existsSync(sourceFilePath)) {
          const { namedExports, hasDefaultExport } =
            extractExportsFromFile(sourceFilePath)
          const sourceFile = `${dir}/${fileName}`

          // Map each named export from the re-exported file
          for (const exportName of namedExports) {
            if (!exportMap[exportName]) {
              exportMap[exportName] = sourceFile
            }
          }

          // For default exports, also map PascalCase version of filename
          if (hasDefaultExport) {
            const defaultName = fileName
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join("")
            if (!exportMap[defaultName]) {
              exportMap[defaultName] = sourceFile
            }
          }
        }
      }
    }
  }

  scanDirectory(srcPath)
  processBarrelFiles()

  // Debug: Log a sample of the export map to help diagnose issues
  if (process.env.DEBUG_EXPORT_MAP) {
    const sampleExports = Object.entries(exportMap).slice(0, 30)
    console.log("\n=== Sample Export Map ===")
    sampleExports.forEach(([name, path]) => {
      console.log(`  ${name} -> ${path}`)
    })
    console.log("=========================\n")
  }

  return exportMap
}

/**
 * Detect directories in src/ - recursively finds all directories with index.ts
 */
function detectImportDirectories(modulePath) {
  const srcPath = path.join(modulePath, "src")
  if (!fs.existsSync(srcPath)) {
    return { allDirectories: [], directories: [], barrelDirectories: [] }
  }

  const allDirectories = []
  const directories = []
  const barrelDirectories = []

  function scanDirectory(dirPath, relativePath = "") {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules"
      ) {
        const fullPath = path.join(dirPath, entry.name)
        const relPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name

        allDirectories.push(relPath)

        const indexPath = path.join(fullPath, "index.ts")
        if (fs.existsSync(indexPath)) {
          directories.push(relPath)
          if (isBarrelFile(indexPath)) {
            barrelDirectories.push(relPath)
          }
        }

        // Recursively scan subdirectories
        scanDirectory(fullPath, relPath)
      }
    }
  }

  scanDirectory(srcPath)

  return { allDirectories, directories, barrelDirectories }
}

/**
 * Check if a file has a default export
 */
function hasDefaultExport(filePath) {
  if (!fs.existsSync(filePath)) return false
  const content = fs.readFileSync(filePath, "utf8")
  return (
    /export\s+default\s+/.test(content) ||
    /export\s*\{[^}]*\s+as\s+default\s*\}/.test(content)
  )
}

/**
 * Determine which barrel files can be safely removed
 */
function getRemovableBarrelFiles(modulePath, barrelDirectories, keepRootLevelBarrel = false) {
  const removable = []

  for (const dir of barrelDirectories) {
    // If keepRootLevelBarrel is true, skip top-level barrels (they're referenced by src/index.ts)
    // Only remove nested barrels (e.g., "api-key/steps", not "api-key")
    if (keepRootLevelBarrel && !dir.includes("/")) {
      continue
    }

    const barrelPath = path.join(modulePath, "src", dir, "index.ts")
    if (!fs.existsSync(barrelPath)) continue

    const content = fs.readFileSync(barrelPath, "utf8")

    // Remove barrels that:
    // 1. Use "export { default as Name }" pattern
    // 2. Use "export * from" pattern (re-export all exports from other files)
    const hasExportStar = /export\s+\*\s+from/.test(content)
    const hasDefaultExports = /export\s*\{\s*default/.test(content)

    // We can safely remove barrels that only re-export from local files
    if (hasDefaultExports || hasExportStar) {
      removable.push(dir)
    }
  }

  return removable
}

/**
 * Update package.json with imports field
 */
function updatePackageJson(modulePath, directories) {
  const packageJsonPath = path.join(modulePath, "package.json")
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

  if (directories.length === 0) return false

  // Filter out test and fixture directories
  const publicDirectories = directories.filter(
    dir => !dir.includes("__tests__") && !dir.includes("__fixtures__")
  )

  const imports = {}
  for (const dir of publicDirectories) {
    imports[`#${dir}/*`] = {
      types: `./dist/${dir}/*.d.ts`,
      default: `./dist/${dir}/*.js`,
    }
  }

  // Rebuild package.json with imports after types/main
  const orderedPackageJson = {}
  let importsAdded = false

  for (const [key, value] of Object.entries(packageJson)) {
    if (key === "imports") continue

    orderedPackageJson[key] = value

    if (key === "types" || (key === "main" && !packageJson.types)) {
      orderedPackageJson.imports = imports
      importsAdded = true
    }
  }

  if (!importsAdded) {
    orderedPackageJson.imports = imports
  }

  // Update scripts
  if (orderedPackageJson.scripts) {
    delete orderedPackageJson.scripts["resolve:aliases"]

    if (orderedPackageJson.scripts.build) {
      if (orderedPackageJson.scripts.build.includes("resolve:aliases")) {
        orderedPackageJson.scripts.build =
          "yarn run -T rimraf dist && yarn run -T tsc --build"
      } else if (!orderedPackageJson.scripts.build.includes("yarn run -T")) {
        orderedPackageJson.scripts.build = orderedPackageJson.scripts.build
          .replace(/\brimraf\b/, "yarn run -T rimraf")
          .replace(/\btsc\b/, "yarn run -T tsc")
      }
    }

    if (
      orderedPackageJson.scripts.watch &&
      !orderedPackageJson.scripts.watch.includes("yarn run -T")
    ) {
      orderedPackageJson.scripts.watch =
        orderedPackageJson.scripts.watch.replace(/\btsc\b/, "yarn run -T tsc")
    }

    if (
      orderedPackageJson.scripts["watch:test"] &&
      !orderedPackageJson.scripts["watch:test"].includes("yarn run -T")
    ) {
      orderedPackageJson.scripts["watch:test"] = orderedPackageJson.scripts[
        "watch:test"
      ].replace(/\btsc\b/, "yarn run -T tsc")
    }
  }

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(orderedPackageJson, null, 2) + "\n"
  )
  return true
}

/**
 * Update imports in TypeScript files using the export map
 */
function updateImportsInFile(filePath, directories, exportMap, modulePath) {
  if (!fs.existsSync(filePath)) return 0

  let content = fs.readFileSync(filePath, "utf8")
  let replacements = 0

  // Get the current file's directory relative to src/
  const srcPath = path.join(modulePath, "src")
  const fileDir = path.dirname(path.relative(srcPath, filePath))

  for (const dir of directories) {
    // Escape directory name for regex (handles nested paths like "inventory/steps")
    const escapedDir = dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    let match
    const importMatches = []

    // Pattern 1: Handle named imports from alias: import { Name1, Name2 } from "@dir"
    const namedImportFromAliasRegex = new RegExp(
      `import\\s+(type\\s+)?\\{([^}]+)\\}\\s*from\\s*["']@${escapedDir}["']`,
      "g"
    )

    while ((match = namedImportFromAliasRegex.exec(content)) !== null) {
      importMatches.push({
        fullMatch: match[0],
        isTypeImport: !!match[1],
        imports: match[2],
        isNamedImport: true,
      })
    }

    // Pattern 2: Handle named imports from relative path: import { Name1 } from "../../dir"
    const namedImportFromRelativeRegex = new RegExp(
      `import\\s+(type\\s+)?\\{([^}]+)\\}\\s*from\\s*["'](?:\\.{1,2}/)+${escapedDir}["']`,
      "g"
    )

    while ((match = namedImportFromRelativeRegex.exec(content)) !== null) {
      importMatches.push({
        fullMatch: match[0],
        isTypeImport: !!match[1],
        imports: match[2],
        isNamedImport: true,
      })
    }

    // Pattern 3: Handle default imports from alias: import Name from "@dir"
    const defaultImportFromAliasRegex = new RegExp(
      `import\\s+(type\\s+)?(\\w+)\\s+from\\s*["']@${escapedDir}["']`,
      "g"
    )

    while ((match = defaultImportFromAliasRegex.exec(content)) !== null) {
      // Make sure this isn't already captured as a named import
      const fullMatch = match[0]
      if (!fullMatch.includes("{")) {
        importMatches.push({
          fullMatch: match[0],
          isTypeImport: !!match[1],
          imports: match[2],
          isNamedImport: false,
        })
      }
    }

    // Pattern 4: Handle default imports from relative path: import Name from "../../dir"
    const defaultImportFromRelativeRegex = new RegExp(
      `import\\s+(type\\s+)?(\\w+)\\s+from\\s*["'](?:\\.{1,2}/)+${escapedDir}["']`,
      "g"
    )

    while ((match = defaultImportFromRelativeRegex.exec(content)) !== null) {
      // Make sure this isn't already captured as a named import
      const fullMatch = match[0]
      if (!fullMatch.includes("{")) {
        importMatches.push({
          fullMatch: match[0],
          isTypeImport: !!match[1],
          imports: match[2],
          isNamedImport: false,
        })
      }
    }

    // Pattern 5: Handle named imports from short relative paths that resolve to this dir
    // e.g., from "../steps" when current file is in "sales-channel/workflows"
    const shortRelativeNamedRegex = /import\s+(type\s+)?\{([^}]+)\}\s*from\s*["']((?:\.{1,2}\/)+[^"']+)["']/g
    while ((match = shortRelativeNamedRegex.exec(content)) !== null) {
      const relativePath = match[3]
      // Resolve relative path to absolute path within src/
      const resolvedPath = path.normalize(path.join(fileDir, relativePath))
      // Check if this resolves to the current directory we're processing
      if (resolvedPath === dir) {
        importMatches.push({
          fullMatch: match[0],
          isTypeImport: !!match[1],
          imports: match[2],
          isNamedImport: true,
        })
      }
    }

    // Pattern 6: Handle default imports from short relative paths
    const shortRelativeDefaultRegex = /import\s+(type\s+)?(\w+)\s+from\s*["']((?:\.{1,2}\/)+[^"']+)["']/g
    while ((match = shortRelativeDefaultRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      if (!fullMatch.includes("{")) {
        const relativePath = match[3]
        const resolvedPath = path.normalize(path.join(fileDir, relativePath))
        if (resolvedPath === dir) {
          importMatches.push({
            fullMatch: match[0],
            isTypeImport: !!match[1],
            imports: match[2],
            isNamedImport: false,
          })
        }
      }
    }

    // Process in reverse order
    for (let i = importMatches.length - 1; i >= 0; i--) {
      const { fullMatch, imports, isTypeImport, isNamedImport } =
        importMatches[i]

      let importNames
      if (isNamedImport) {
        // Named import: parse comma-separated names
        importNames = imports
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && s !== "type")
      } else {
        // Default import: single name
        importNames = [imports.trim()]
      }

      // Group imports by source file
      const importsByFile = {}

      for (const importName of importNames) {
        let cleanName = importName.replace(/^type\s+/, "")

        const asMatch = cleanName.match(/^(\w+)\s+as\s+(\w+)$/)
        const originalName = asMatch ? asMatch[1] : cleanName
        const finalName = asMatch ? asMatch[2] : cleanName

        // Look up source file in export map
        let sourceFile = exportMap[originalName]

        // If not found in export map, skip this import entirely
        if (!sourceFile) {
          // Don't replace this import - leave it as-is for validation to catch
          log(
            `   ⚠ Warning: Could not find export "${originalName}" in export map for ${dir}`,
            "yellow"
          )
          log(`      File: ${path.relative(modulePath, filePath)}`, "yellow")
          continue
        }

        // Verify it's from the expected directory
        if (!sourceFile.startsWith(`${dir}/`)) {
          log(
            `   ⚠ Warning: Export "${originalName}" found in ${sourceFile}, not ${dir}/`,
            "yellow"
          )
          log(`      File: ${path.relative(modulePath, filePath)}`, "yellow")
          continue
        }

        if (!importsByFile[sourceFile]) {
          importsByFile[sourceFile] = { names: [], isDefault: !isNamedImport }
        }
        importsByFile[sourceFile].names.push(finalName)
      }

      // Only proceed if we successfully resolved at least one import
      if (Object.keys(importsByFile).length === 0) {
        // No imports could be resolved - leave the original import unchanged
        log(
          `   ⚠ Skipping unresolvable import in ${path.relative(
            modulePath,
            filePath
          )}`,
          "yellow"
        )
        continue
      }

      // Generate grouped imports
      const newImports = Object.entries(importsByFile)
        .map(([sourceFile, { names, isDefault }]) => {
          const hashPath = `#${sourceFile}`
          const typePrefix = isTypeImport ? "type " : ""

          const fullPath = path.join(modulePath, "src", `${sourceFile}.ts`)
          const hasDefault = hasDefaultExport(fullPath)

          // For default imports or single default exports, use default import syntax
          if ((isDefault || hasDefault) && names.length === 1) {
            return `import ${typePrefix}${names[0]} from "${hashPath}"`
          } else {
            // Otherwise use named import syntax
            return `import ${typePrefix}{ ${names.join(
              ", "
            )} } from "${hashPath}"`
          }
        })
        .join("\n")

      if (newImports) {
        content = content.replace(fullMatch, newImports)
        replacements++
      }
    }

    // Handle: from "@dir/file" -> from "#dir/file" (ONLY for non-barrel files)
    // This handles imports that already specify a specific file path
    const aliasWithFilePattern = new RegExp(
      `from\\s+["']@${escapedDir}/([^"']+)["']`,
      "g"
    )
    const directMatches = [...content.matchAll(aliasWithFilePattern)]
    for (const match of directMatches) {
      const subPath = match[1]
      // Skip if this is a barrel directory (will be handled by import resolution)
      if (!directories.includes(`${dir}/${subPath}`)) {
        content = content.replace(match[0], `from "#${dir}/${subPath}"`)
        replacements++
      }
    }

    // Handle relative with file: from "../dir/file" -> from "#dir/file" (ONLY for non-barrel files)
    const relativeWithFilePattern = new RegExp(
      `from\\s+["'](\\.{1,2}/)+${escapedDir}/([^"']+)["']`,
      "g"
    )
    const relativeMatches = [...content.matchAll(relativeWithFilePattern)]
    for (const match of relativeMatches) {
      const subPath = match[2]
      // Skip if this is a barrel directory (will be handled by import resolution)
      if (!directories.includes(`${dir}/${subPath}`)) {
        content = content.replace(match[0], `from "#${dir}/${subPath}"`)
        replacements++
      }
    }
  }

  // Catch-all pattern: Convert ANY remaining relative imports within the package to hash imports
  // This handles cases like: from "../../steps/return/file" -> from "#order/steps/return/file"
  const allRelativeImportsRegex = /from\s+["']((?:\.{1,2}\/)+([^"']+))["']/g
  let relativeMatch
  const relativeReplacements = []

  while ((relativeMatch = allRelativeImportsRegex.exec(content)) !== null) {
    const fullRelativePath = relativeMatch[1]

    // Resolve the relative path to absolute within src/
    const resolvedPath = path.normalize(path.join(fileDir, fullRelativePath))

    // Check if this is an internal import (doesn't go outside src/)
    if (!resolvedPath.startsWith("..")) {
      // Determine the root module directory (e.g., "order" from "order/steps/return/file")
      const pathParts = resolvedPath.split(path.sep).filter(Boolean)
      if (pathParts.length > 0) {
        const rootModule = pathParts[0]

        // Verify this is a valid module directory
        if (directories.includes(rootModule)) {
          // Convert to hash import
          const hashImportPath = resolvedPath.replace(/\\/g, "/")
          const oldImport = relativeMatch[0]
          const newImport = `from "#${hashImportPath}"`

          relativeReplacements.push({
            old: oldImport,
            new: newImport,
            index: relativeMatch.index
          })
        }
      }
    }
  }

  // Apply replacements in reverse order to maintain correct indices
  for (let i = relativeReplacements.length - 1; i >= 0; i--) {
    const { old, new: newImport } = relativeReplacements[i]
    if (content.includes(old)) {
      content = content.replace(old, newImport)
      replacements++
    }
  }

  if (replacements > 0) {
    fs.writeFileSync(filePath, content)
  }

  return replacements
}

/**
 * Recursively update imports in a directory
 */
function updateImportsInDirectory(dirPath, directories, exportMap, modulePath) {
  if (!fs.existsSync(dirPath)) return 0

  let totalReplacements = 0
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      totalReplacements += updateImportsInDirectory(
        fullPath,
        directories,
        exportMap,
        modulePath
      )
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      // Skip barrel files (index.ts) - they should keep relative imports
      if (entry.name === "index.ts") {
        continue
      }

      totalReplacements += updateImportsInFile(
        fullPath,
        directories,
        exportMap,
        modulePath
      )
    }
  }

  return totalReplacements
}

/**
 * Update tsconfig.json
 */
function updateTsConfig(modulePath) {
  const tsconfigPath = path.join(modulePath, "tsconfig.json")
  if (!fs.existsSync(tsconfigPath)) return

  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"))

  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {}
  }

  if (tsconfig.compilerOptions.paths) {
    const pathsToRemove = []

    for (const [key, value] of Object.entries(tsconfig.compilerOptions.paths)) {
      const isLocalPath =
        key.startsWith("@") &&
        Array.isArray(value) &&
        value.some((p) => p.startsWith("./src/"))

      if (isLocalPath) {
        pathsToRemove.push(key)
      }
    }

    for (const key of pathsToRemove) {
      delete tsconfig.compilerOptions.paths[key]
    }

    if (Object.keys(tsconfig.compilerOptions.paths).length === 0) {
      delete tsconfig.compilerOptions.paths
    }
  }

  if (!tsconfig.compilerOptions.rootDir) {
    tsconfig.compilerOptions.rootDir = "./src"
  }

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n")
}

/**
 * Update mikro-orm.config.dev.ts
 */
function updateMikroOrmConfig(modulePath, exportMap) {
  const configPath = path.join(modulePath, "mikro-orm.config.dev.ts")
  if (!fs.existsSync(configPath)) return

  let content = fs.readFileSync(configPath, "utf8")
  let modified = false

  // Find model files in models directory
  const modelsDir = path.join(modulePath, "src/models")
  if (fs.existsSync(modelsDir)) {
    const modelFiles = fs
      .readdirSync(modelsDir)
      .filter((f) => f.endsWith(".ts") && f !== "index.ts")
      .map((f) => f.replace(".ts", ""))

    if (modelFiles.length > 0) {
      // Generate imports
      const imports = modelFiles
        .map((m) => {
          const className = m
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("")

          const filePath = path.join(modelsDir, `${m}.ts`)
          const hasDefault = hasDefaultExport(filePath)

          if (hasDefault) {
            return `import ${className} from "#models/${m}"`
          } else {
            return `import { ${className} } from "#models/${m}"`
          }
        })
        .join("\n")

      const entityList = modelFiles
        .map((m) =>
          m
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("")
        )
        .join(", ")

      // Pattern 1: import * as Models from ... with entities: [Models.*] or [Models]
      if (
        content.includes("entities: [Models.*]") ||
        content.includes("entities: [Models]")
      ) {
        content = content.replace(/import \* as Models from.*/, imports)
        content = content.replace(
          /entities:\s*\[Models\.\*\]/,
          `entities: [${entityList}]`
        )
        content = content.replace(
          /entities:\s*\[Models\]/,
          `entities: [${entityList}]`
        )
        modified = true
      }

      // Pattern 2: import * as entities from "./src/models" with Object.values(entities)
      if (
        /import \* as \w+ from ["']\.\/src\/models["']/.test(content) &&
        content.includes("Object.values(")
      ) {
        content = content.replace(
          /import \* as \w+ from ["']\.\/src\/models["']/,
          imports
        )
        content = content.replace(
          /entities:\s*Object\.values\(\w+\)/,
          `entities: [${entityList}]`
        )
        modified = true
      }
    }
  }

  if (modified) {
    fs.writeFileSync(configPath, content)
  }
}

/**
 * Recursively find all .ts files (excluding index.ts) in a directory
 */
function findAllTsFiles(dirPath, relativeTo = "", excludeBarrels = true) {
  const results = []

  function scan(currentPath, currentRelative) {
    if (!fs.existsSync(currentPath)) return

    const entries = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue

      const fullPath = path.join(currentPath, entry.name)
      const relPath = currentRelative ? `${currentRelative}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        scan(fullPath, relPath)
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        // Exclude index.ts if specified
        if (excludeBarrels && entry.name === "index.ts") continue

        // Add the file with its relative path (without .ts extension)
        results.push(relPath.replace(/\.ts$/, ""))
      }
    }
  }

  scan(dirPath, relativeTo)
  return results
}

/**
 * Update root-level barrel files to re-export from actual files instead of removed nested barrels
 */
function updateRootLevelBarrels(modulePath, barrelDirectories, removableBarrels) {
  const srcPath = path.join(modulePath, "src")
  const rootBarrels = barrelDirectories.filter(dir => !dir.includes("/"))

  for (const rootDir of rootBarrels) {
    const barrelPath = path.join(srcPath, rootDir, "index.ts")
    if (!fs.existsSync(barrelPath)) continue

    let content = fs.readFileSync(barrelPath, "utf8")
    let modified = false

    // Find all export * from "./subdir" statements
    const exportStarRegex = /export\s+\*\s+from\s+['"]\.\/([\w-]+)['"]/g
    let match

    const replacements = []
    while ((match = exportStarRegex.exec(content)) !== null) {
      const subdir = match[1]
      const fullSubdirPath = `${rootDir}/${subdir}`

      // Check if this subdir's barrel is being removed
      if (removableBarrels.includes(fullSubdirPath)) {
        const subdirPath = path.join(srcPath, rootDir, subdir)

        // Check if it's a directory
        if (fs.existsSync(subdirPath) && fs.statSync(subdirPath).isDirectory()) {
          // Recursively find all .ts files in the subdirectory (excluding index.ts)
          const files = findAllTsFiles(subdirPath)

          // Generate export statements for each file (with proper nested paths)
          const newExports = files.map(file => `export * from "./${subdir}/${file}"`).join("\n")

          replacements.push({
            oldStatement: match[0],
            newStatements: newExports,
          })
          modified = true
        }
      }
    }

    // Apply replacements
    for (const { oldStatement, newStatements } of replacements) {
      content = content.replace(oldStatement, newStatements)
    }

    if (modified) {
      fs.writeFileSync(barrelPath, content)
      log(`   ✓ Updated ${rootDir}/index.ts to reference actual files`, "green")
    }
  }
}

/**
 * Remove barrel files
 */
function removeBarrelFiles(modulePath, removableBarrels) {
  const removed = []

  for (const dir of removableBarrels) {
    const barrelPath = path.join(modulePath, "src", dir, "index.ts")
    if (fs.existsSync(barrelPath)) {
      fs.unlinkSync(barrelPath)
      removed.push(path.join("src", dir, "index.ts"))
    }
  }

  return removed
}

/**
 * Validate that relative imports have been properly replaced with hash imports
 * Returns an object with validation results
 */
function validateImportReplacements(
  packagePath,
  directories,
  removableBarrels
) {
  const issues = {
    unreplacedRelativeImports: [],
    invalidHashImports: [],
    barrelFileImports: [],
    hasIssues: false,
  }

  function checkFile(filePath, relativeFilePath) {
    if (!fs.existsSync(filePath) || !filePath.endsWith(".ts")) return

    // Skip the root index.ts file (main package entry point)
    if (relativeFilePath === "src/index.ts") {
      return
    }

    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Check for relative imports that should have been replaced
      for (const dir of directories) {
        // Pattern: from "../dir" or from "./dir" or from "../../dir"
        // Only check import statements, not export statements
        const relativePattern = new RegExp(
          `import\\s+.*from\\s+["'](\\.{1,2}/)+${dir}(/[^"']*)?["']`
        )
        if (relativePattern.test(line)) {
          issues.unreplacedRelativeImports.push({
            file: relativeFilePath,
            line: lineNumber,
            content: line.trim(),
            directory: dir,
          })
          issues.hasIssues = true
        }
      }

      // Check for hash imports pointing to barrel files that will be removed
      for (const dir of removableBarrels) {
        // Pattern: from "#dir" or from "#dir/index"
        const barrelImportPattern = new RegExp(
          `from\\s+["']#${dir}(/index)?["']`
        )
        if (barrelImportPattern.test(line)) {
          issues.barrelFileImports.push({
            file: relativeFilePath,
            line: lineNumber,
            content: line.trim(),
            directory: dir,
          })
          issues.hasIssues = true
        }
      }

      // Check for hash imports that might be invalid
      const hashImportMatch = line.match(/from\s+["']#([^/"']+)\/([^"']+)["']/)
      if (hashImportMatch) {
        const [, dirName, importPath] = hashImportMatch

        // Verify the directory exists
        if (!directories.includes(dirName)) {
          issues.invalidHashImports.push({
            file: relativeFilePath,
            line: lineNumber,
            content: line.trim(),
            directory: dirName,
            reason: "Directory not found in package",
          })
          issues.hasIssues = true
        }
      }
    })
  }

  function scanDirectory(dirPath, baseRelPath = "") {
    if (!fs.existsSync(dirPath)) return

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relPath = baseRelPath ? `${baseRelPath}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        // Skip test directories and node_modules
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          scanDirectory(fullPath, relPath)
        }
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        checkFile(fullPath, relPath)
      }
    }
  }

  // Scan src directory
  const srcPath = path.join(packagePath, "src")
  if (fs.existsSync(srcPath)) {
    scanDirectory(srcPath, "src")
  }

  // Scan integration-tests directory
  const testsPath = path.join(packagePath, "integration-tests")
  if (fs.existsSync(testsPath)) {
    scanDirectory(testsPath, "integration-tests")
  }

  return issues
}

/**
 * Report validation issues
 */
function reportValidationIssues(issues) {
  if (!issues.hasIssues) {
    log("   ✓ All imports properly converted to hash imports", "green")
    return
  }

  log("   ⚠ Found import conversion issues:", "yellow")

  if (issues.unreplacedRelativeImports.length > 0) {
    log(
      `\n   Unreplaced relative imports (${issues.unreplacedRelativeImports.length}):`,
      "red"
    )
    issues.unreplacedRelativeImports.forEach(
      ({ file, line, content, directory }) => {
        log(`     ${file}:${line}`, "red")
        log(`       ${content}`, "red")
        log(`       → Should use #${directory}/specific-file`, "yellow")
      }
    )
  }

  if (issues.barrelFileImports.length > 0) {
    log(
      `\n   Imports pointing to barrel files being removed (${issues.barrelFileImports.length}):`,
      "red"
    )
    issues.barrelFileImports.forEach(({ file, line, content, directory }) => {
      log(`     ${file}:${line}`, "red")
      log(`       ${content}`, "red")
      log(`       → Barrel file #${directory}/index is being removed`, "yellow")
      log(
        `       → Update to import from specific file: #${directory}/specific-file`,
        "yellow"
      )
    })
  }

  if (issues.invalidHashImports.length > 0) {
    log(
      `\n   Invalid hash imports (${issues.invalidHashImports.length}):`,
      "red"
    )
    issues.invalidHashImports.forEach(({ file, line, content, reason }) => {
      log(`     ${file}:${line}`, "red")
      log(`       ${content}`, "red")
      log(`       → ${reason}`, "yellow")
    })
  }
}

/**
 * Process a single package
 */
function processPackage(packageName, packagesDir, options = {}) {
  const packagePath = path.join(packagesDir, packageName)

  log(`\n${"=".repeat(60)}`, "cyan")
  log(`Processing package: ${packageName}`, "cyan")
  log("=".repeat(60), "cyan")

  if (!fs.existsSync(path.join(packagePath, "src"))) {
    log("⚠️  No src directory found, skipping", "yellow")
    return { success: false, skipped: true }
  }

  const { allDirectories, directories, barrelDirectories } =
    detectImportDirectories(packagePath)

  if (allDirectories.length === 0) {
    log("✓ No directories found in src", "green")
    return { success: true, skipped: true }
  }

  log(`Found all directories in src: ${allDirectories.join(", ")}`, "blue")
  if (directories.length > 0) {
    log(`Found directories with index.ts: ${directories.join(", ")}`, "blue")
  }
  if (barrelDirectories.length > 0) {
    log(`Found barrel files in: ${barrelDirectories.join(", ")}`, "blue")
  }

  // Determine which barrel files can be removed
  const removableBarrels = getRemovableBarrelFiles(
    packagePath,
    barrelDirectories,
    options.keepRootLevelBarrel
  )
  if (removableBarrels.length > 0) {
    log(
      `Barrel files that will be removed: ${removableBarrels.join(", ")}`,
      "blue"
    )
  }

  try {
    // 0. Build comprehensive export map
    log("\n0. Building export map from all source files...", "blue")
    const exportMap = buildExportMap(packagePath)
    const exportCount = Object.keys(exportMap).length
    log(`   Found ${exportCount} total exports across all files`, "blue")
    log("   ✓ Export map built", "green")

    // 1. Update package.json
    log("\n1. Updating package.json...", "blue")
    updatePackageJson(packagePath, allDirectories)
    log("   ✓ package.json updated", "green")

    // 2. Update tsconfig.json
    log("\n2. Updating tsconfig.json...", "blue")
    updateTsConfig(packagePath)
    log("   ✓ tsconfig.json updated", "green")

    // 3. Update imports in src
    log("\n3. Updating imports in src/...", "blue")
    const srcReplacements = updateImportsInDirectory(
      path.join(packagePath, "src"),
      allDirectories,
      exportMap,
      packagePath
    )
    log(`   ✓ Updated ${srcReplacements} imports in src/`, "green")

    // 4. Update imports in integration-tests
    log("\n4. Updating imports in integration-tests/...", "blue")
    const testReplacements = updateImportsInDirectory(
      path.join(packagePath, "integration-tests"),
      allDirectories,
      exportMap,
      packagePath
    )
    log(
      `   ✓ Updated ${testReplacements} imports in integration-tests/`,
      "green"
    )

    // 5. Validate import replacements
    log("\n5. Validating import replacements...", "blue")
    const validationIssues = validateImportReplacements(
      packagePath,
      allDirectories,
      removableBarrels
    )
    reportValidationIssues(validationIssues)
    if (validationIssues.hasIssues) {
      throw new Error(
        "Import validation failed - found unreplaced or invalid imports"
      )
    }

    // 6. Update mikro-orm config
    log("\n6. Updating mikro-orm.config.dev.ts...", "blue")
    updateMikroOrmConfig(packagePath, exportMap)
    log("   ✓ mikro-orm config updated", "green")

    // 7. Update root-level barrels (if keeping them)
    if (options.keepRootLevelBarrel && removableBarrels.length > 0) {
      log("\n7. Updating root-level barrel files...", "blue")
      updateRootLevelBarrels(packagePath, barrelDirectories, removableBarrels)
      log("   ✓ Root-level barrels updated", "green")
    }

    // 8. Remove barrel files
    if (removableBarrels.length > 0) {
      log("\n8. Removing barrel files...", "blue")
      const removed = removeBarrelFiles(packagePath, removableBarrels)
      removed.forEach((file) => log(`   ✓ Removed ${file}`, "green"))
    } else {
      log("\n8. No removable barrel files found...", "blue")
    }

    // 9. Run prettier
    log("\n9. Running prettier...", "blue")
    try {
      const pathsToFormat = []
      if (fs.existsSync(path.join(packagePath, "src"))) {
        pathsToFormat.push(`"${packagePath}/src/**/*.ts"`)
      }
      if (fs.existsSync(path.join(packagePath, "integration-tests"))) {
        pathsToFormat.push(`"${packagePath}/integration-tests/**/*.ts"`)
      }
      const rootTsFiles = fs
        .readdirSync(packagePath)
        .filter((f) => f.endsWith(".ts"))
      if (rootTsFiles.length > 0) {
        pathsToFormat.push(
          ...rootTsFiles.map((f) => `"${path.join(packagePath, f)}"`)
        )
      }

      if (pathsToFormat.length > 0) {
        execSync(`yarn run -T prettier --write ${pathsToFormat.join(" ")}`, {
          stdio: "inherit",
          env: { ...process.env, FORCE_COLOR: "1" },
        })
        log("   ✓ Prettier completed", "green")
      } else {
        log("   ⚠ No TypeScript files to format", "yellow")
      }
    } catch (error) {
      log("   ✗ Prettier failed", "red")
      throw new Error("Prettier failed")
    }

    // 10. Run eslint
    log("\n10. Running eslint...", "blue")
    try {
      // Get the relative path from the root
      const rootDir = path.join(packagePath, "../../..")
      const packageRelPath = path.relative(rootDir, packagePath)
      execSync(
        `yarn run -T eslint --fix "${packageRelPath}/src/**/*.ts" "${packageRelPath}/integration-tests/**/*.ts" "${packageRelPath}/*.ts"`,
        {
          cwd: rootDir,
          stdio: "inherit",
          env: { ...process.env, FORCE_COLOR: "1" },
        }
      )
      log("   ✓ Eslint completed", "green")
    } catch (error) {
      log("   ⚠ Eslint completed with warnings", "yellow")
    }

    // 11. Build
    log("\n11. Building package...", "blue")
    try {
      execSync("yarn build", {
        cwd: packagePath,
        stdio: "inherit",
        env: { ...process.env, FORCE_COLOR: "1" },
      })
      log("   ✓ Build successful", "green")
    } catch (error) {
      log("   ✗ Build failed", "red")
      throw new Error("Build failed")
    }

    // 12. Run tests
    log("\n12. Running integration tests...", "blue")
    try {
      execSync("yarn test:integration", {
        cwd: packagePath,
        stdio: "inherit",
        env: { ...process.env, FORCE_COLOR: "1" },
      })
      log("   ✓ Tests passed", "green")
    } catch (error) {
      log("   ✗ Tests failed", "red")
      throw new Error("Tests failed")
    }

    log(`\n✓ Package ${packageName} processed successfully!`, "green")
    return { success: true }
  } catch (error) {
    log(`\n✗ Error processing package ${packageName}: ${error.message}`, "red")
    return { success: false, error: error.message }
  }
}

/**
 * Print usage information
 */
function printHelp() {
  console.log(`
Barrel File Removal Script v2

Removes barrel files and replaces module path aliases with hash imports.

Usage:
  node remove-barrel-files-v2.js [OPTIONS] [PACKAGES_DIR] [PACKAGE_NAMES...]

Options:
  --help, -h                  Show this help message
  --keep-root-level-barrel    Keep top-level barrel files (e.g., api-key/index.ts)
                              Only remove nested barrels (e.g., api-key/steps/index.ts)

Arguments:
  PACKAGES_DIR    Directory containing packages (default: packages/modules)
  PACKAGE_NAMES   Specific package names to process (default: all)

Examples:
  # Process all packages in packages/modules
  node remove-barrel-files-v2.js

  # Process specific packages in packages/modules
  node remove-barrel-files-v2.js product cart

  # Process all packages in packages/core, keeping root barrels
  node remove-barrel-files-v2.js --keep-root-level-barrel packages/core

  # Process specific packages in packages/core with root barrels
  node remove-barrel-files-v2.js --keep-root-level-barrel packages/core utils types

Features:
  ✓ Works on any packages directory
  ✓ Validates relative imports are replaced with hash imports
  ✓ Reports unreplaced or invalid imports
  ✓ Updates package.json with "imports" field
  ✓ Updates tsconfig.json to remove path aliases
  ✓ Runs prettier, eslint, builds, and tests
`)
  process.exit(0)
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)

  // Handle help flag
  if (args.includes("--help") || args.includes("-h")) {
    printHelp()
  }

  log("\n" + "=".repeat(60), "cyan")
  log("Barrel File Removal Script v2", "cyan")
  log("=".repeat(60) + "\n", "cyan")

  // Parse options
  const options = {
    keepRootLevelBarrel: args.includes("--keep-root-level-barrel"),
  }

  // Remove option flags from args
  const nonFlagArgs = args.filter(arg => !arg.startsWith("--"))

  // Parse arguments
  let packagesDir = DEFAULT_PACKAGES_DIR
  let packageNames = []

  // Check if first arg is a directory path
  if (nonFlagArgs.length > 0) {
    const possibleDir = nonFlagArgs[0].startsWith("packages/")
      ? path.join(__dirname, "..", nonFlagArgs[0])
      : nonFlagArgs[0]

    if (fs.existsSync(possibleDir) && fs.statSync(possibleDir).isDirectory()) {
      packagesDir = possibleDir
      packageNames = nonFlagArgs.slice(1)
      log(
        `Using packages directory: ${path.relative(
          path.join(__dirname, ".."),
          packagesDir
        )}\n`,
        "cyan"
      )
    } else {
      packageNames = nonFlagArgs
    }
  }

  // Log options
  if (options.keepRootLevelBarrel) {
    log("Option: Keeping root-level barrel files\n", "cyan")
  }

  // Get list of packages to process
  let packagesToProcess = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !PACKAGES_TO_SKIP.includes(name))

  // Filter by specified package names if provided
  if (packageNames.length > 0) {
    const available = packagesToProcess
    packagesToProcess = packageNames.filter((name) => available.includes(name))
    const notFound = packageNames.filter((name) => !available.includes(name))

    if (notFound.length > 0) {
      log(`Warning: Packages not found: ${notFound.join(", ")}`, "yellow")
    }

    if (packagesToProcess.length === 0) {
      log("Error: No valid packages to process", "red")
      process.exit(1)
    }

    log(
      `Processing only specified packages: ${packagesToProcess.join(", ")}\n`,
      "yellow"
    )
  } else {
    log(
      `Processing all packages (${packagesToProcess.length} total)\n`,
      "yellow"
    )
  }

  const results = {
    total: packagesToProcess.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  for (const packageName of packagesToProcess) {
    const result = processPackage(packageName, packagesDir, options)

    if (result.skipped) {
      results.skipped++
    } else if (result.success) {
      results.successful++
    } else {
      results.failed++
      results.errors.push({ package: packageName, error: result.error })
    }
  }

  // Print summary
  log("\n" + "=".repeat(60), "cyan")
  log("Summary", "cyan")
  log("=".repeat(60), "cyan")
  log(`Total packages:     ${results.total}`)
  log(`Successful:         ${results.successful}`, "green")
  log(`Skipped:            ${results.skipped}`, "yellow")
  log(
    `Failed:             ${results.failed}`,
    results.failed > 0 ? "red" : "reset"
  )

  if (results.errors.length > 0) {
    log("\nFailed packages:", "red")
    results.errors.forEach(({ package: pkg, error }) => {
      log(`  - ${pkg}: ${error}`, "red")
    })
  }

  log("")

  process.exit(results.failed > 0 ? 1 : 0)
}

if (require.main === module) {
  main()
}
