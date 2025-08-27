import { FlagSettings, Logger } from "@medusajs/types"
import { discoverFeatureFlagsFromDir } from "./discover-feature-flags"
import { FlagRouter } from "./flag-router"
import { registerFeatureFlag } from "./register-flag"

export interface DiscoverAndRegisterOptions {
  /** Directory path to discover feature flags from */
  flagDir: string
  /** Project config feature flags */
  projectConfigFlags?: Record<string, any>
  /** Feature flag router instance */
  router: FlagRouter
  /** Logger instance */
  logger?: Logger
  /** Optional tracking function */
  track?: (key: string) => void
  /** Maximum depth for directory discovery */
  maxDepth?: number
}

/**
 * Utility function to discover and register feature flags from a directory
 */
export async function discoverAndRegisterFeatureFlags(
  options: DiscoverAndRegisterOptions
): Promise<void> {
  const {
    flagDir,
    projectConfigFlags = {},
    router,
    logger,
    track,
    maxDepth,
  } = options

  const discovered = await discoverFeatureFlagsFromDir(flagDir, maxDepth)

  for (const def of discovered) {
    const registerOptions: Parameters<typeof registerFeatureFlag>[0] = {
      flag: def as FlagSettings,
      projectConfigFlags,
      router,
      logger,
      track,
    }

    registerFeatureFlag(registerOptions)
  }
}
