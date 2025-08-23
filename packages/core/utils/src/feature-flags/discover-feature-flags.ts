import { FlagSettings } from "@medusajs/types"
import { readdir } from "fs/promises"
import { join, normalize } from "path"
import { dynamicImport, isString } from "../common"

const excludedFiles = ["index.js", "index.ts"]
const excludedExtensions = [".d.ts", ".d.ts.map", ".js.map"]

function isFeatureFlag(flag: unknown): flag is FlagSettings {
  const f = flag as any
  return !!f && isString(f.key) && isString(f.env_key)
}

/**
 * Discover feature flag definitions from a directory (shallow only).
 * Returns all exported values from top-level files that match FlagSettings.
 */
export async function discoverFeatureFlagsFromDir(
  sourcePath?: string
): Promise<FlagSettings[]> {
  if (!sourcePath) {
    return []
  }

  const flagDir = normalize(sourcePath)
  const discovered: FlagSettings[] = []

  const entries = await readdir(flagDir, { withFileTypes: true })
  if (!entries?.length) {
    return discovered
  }

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory()) {
        return
      }

      if (
        excludedExtensions.some((ext) => entry.name.endsWith(ext)) ||
        excludedFiles.includes(entry.name)
      ) {
        return
      }

      const fileExports = await dynamicImport(join(flagDir, entry.name))
      const values = Object.values(fileExports)
      for (const value of values) {
        if (isFeatureFlag(value)) {
          discovered.push(value)
        }
      }
    })
  )

  return discovered
}
