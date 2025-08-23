import { join, normalize } from "path"
import { dynamicImport, isString, readDirRecursive } from "../common"

export type FeatureFlagDefinition = {
  key: string
  env_key: string
  default_val?: boolean
  description?: string
}

const excludedFiles = ["index.js", "index.ts"]
const excludedExtensions = [".d.ts", ".d.ts.map", ".js.map"]

function isFeatureFlag(flag: unknown): flag is FeatureFlagDefinition {
  const f = flag as any
  return !!f && isString(f.key) && isString(f.env_key)
}

/**
 * Recursively discover feature flag definitions from a directory.
 * Returns a flat array of all exported values that match FeatureFlagDefinition.
 */
export async function discoverFeatureFlagsFromDir(
  sourcePath?: string
): Promise<FeatureFlagDefinition[]> {
  if (!sourcePath) {
    return []
  }

  const flagDir = normalize(sourcePath)
  const discovered: FeatureFlagDefinition[] = []

  const files = await readDirRecursive(flagDir)
  if (!files?.length) {
    return discovered
  }

  await Promise.all(
    files.map(async (file) => {
      if (file.isDirectory()) {
        const nested = await discoverFeatureFlagsFromDir(
          join(flagDir, file.name)
        )
        discovered.push(...nested)
        return
      }

      if (
        excludedExtensions.some((ext) => file.name.endsWith(ext)) ||
        excludedFiles.includes(file.name)
      ) {
        return
      }

      const fileExports = await dynamicImport(join(flagDir, file.name))
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
