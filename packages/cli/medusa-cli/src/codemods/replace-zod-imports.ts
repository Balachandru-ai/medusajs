import { execSync } from "child_process"
import fs from "fs"
import reporter from "../reporter/index"
import type { Codemod, CodemodOptions, CodemodResult } from "./types"

const CODEMOD: Codemod = {
  name: "replace-zod-imports",
  description: "Replace all zod imports with @medusajs/framework/zod imports",
  run: replaceZodImports,
}

export default CODEMOD

// Replacement patterns for zod imports
// Order matters: more specific patterns must come before general ones
const REPLACEMENTS = [
  // Default import with identifier "zod": import zod from "zod" -> import { z as zod } from "@medusajs/framework/zod"
  {
    pattern: /import\s+zod\s+from\s+['"]zod['"]/g,
    replacement: `import { z as zod } from "@medusajs/framework/zod"`,
  },
  // Default import with identifier "z": import z from "zod" -> import { z } from "@medusajs/framework/zod"
  {
    pattern: /import\s+z\s+from\s+['"]zod['"]/g,
    replacement: `import { z } from "@medusajs/framework/zod"`,
  },
  // Namespace import: import * as z from "zod" -> import { z } from "@medusajs/framework/zod"
  {
    pattern: /import\s+\*\s+as\s+z\s+from\s+['"]zod['"]/g,
    replacement: `import { z } from "@medusajs/framework/zod"`,
  },
  // Named/type imports: import { z } from "zod" or import type { ZodSchema } from "zod"
  {
    pattern: /from\s+['"]zod['"]/g,
    replacement: `from "@medusajs/framework/zod"`,
  },
  // CommonJS require: require("zod")
  {
    pattern: /require\s*\(\s*['"]zod['"]\s*\)/g,
    replacement: `require("@medusajs/framework/zod")`,
  },
]

const ZOD_IMPORT_PATTERN = /from\s+['"]zod['"]|require\s*\(\s*['"]zod['"]\s*\)/

/**
 * Replace all zod imports with @medusajs/framework/zod imports
 */
async function replaceZodImports(
  options: CodemodOptions
): Promise<CodemodResult> {
  const { dryRun = false } = options
  const targetFiles = await getTargetFiles()

  if (targetFiles.length === 0) {
    reporter.info("  No files found with zod imports")
    return { filesScanned: 0, filesModified: 0, errors: 0 }
  }

  reporter.info(`  Found ${targetFiles.length} files to process`)

  let filesModified = 0
  let errors = 0

  for (const filePath of targetFiles) {
    try {
      if (processFile(filePath, dryRun)) {
        filesModified++
      }
    } catch (error) {
      reporter.error(`✗ Error processing ${filePath}: ${error.message}`)
      errors++
    }
  }

  return { filesScanned: targetFiles.length, filesModified, errors }
}

/**
 * Process a single file and replace zod imports
 * @returns true if the file was modified, false otherwise
 */
function processFile(filePath: string, dryRun: boolean): boolean {
  const content = fs.readFileSync(filePath, "utf8")
  let modifiedContent = content

  for (const { pattern, replacement } of REPLACEMENTS) {
    modifiedContent = modifiedContent.replace(pattern, replacement)
  }

  if (modifiedContent === content) {
    return false
  }

  if (dryRun) {
    reporter.info(`  Would update: ${filePath}`)
  } else {
    fs.writeFileSync(filePath, modifiedContent)
    reporter.info(`✓ Updated: ${filePath}`)
  }

  return true
}

/**
 * Find all TypeScript/JavaScript files that contain zod imports
 * @returns Array of file paths with zod imports
 */
async function getTargetFiles(): Promise<string[]> {
  try {
    // Find TypeScript/JavaScript files, excluding build artifacts, dependencies, and src/admin
    const findCommand = `find . -path "*/src/admin" -prune -o -name node_modules -prune -o -name .git -prune -o -name dist -prune -o -name build -prune -o -name coverage -prune -o -name .medusa -prune -o -name "*.ts" -print -o -name "*.js" -print -o -name "*.tsx" -print -o -name "*.jsx" -print`

    const files = execSync(findCommand, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    })
      .split("\n")
      .filter((line) => line.trim())

    reporter.info(` Scanning ${files.length} files for zod imports...`)

    const targetFiles: string[] = []
    let processedCount = 0

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, "utf8")

        if (ZOD_IMPORT_PATTERN.test(content)) {
          targetFiles.push(file.startsWith("./") ? file.slice(2) : file)
        }

        processedCount++
        if (processedCount % 100 === 0) {
          process.stdout.write(
            `\r Processed ${processedCount}/${files.length} files...`
          )
        }
      } catch {
        // Skip files that can't be read
        continue
      }
    }

    if (processedCount > 0) {
      process.stdout.write(
        `\r Processed ${processedCount} files.                    \n`
      )
    }

    return targetFiles
  } catch (error) {
    reporter.error(`Error finding target files: ${error.message}`)
    return []
  }
}
