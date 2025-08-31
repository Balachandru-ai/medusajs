import { trackFeatureFlag } from "@medusajs/telemetry"
import {
  ContainerRegistrationKeys,
  discoverFeatureFlagsFromDir,
  FeatureFlag,
  FlagRouter,
  registerFeatureFlag,
} from "@medusajs/utils"
import { asFunction } from "awilix"
import { normalize } from "path"
import { configManager } from "../config"
import { container } from "../container"
import { FlagSettings } from "./types"

container.register(
  ContainerRegistrationKeys.FEATURE_FLAG_ROUTER,
  asFunction(() => FeatureFlag)
)

/**
 * Load feature flags from a directory and from the already loaded config under the hood
 * @param sourcePath
 */
export async function featureFlagsLoader(
  sourcePath?: string
): Promise<FlagRouter> {
  const { featureFlags: projectConfigFlags = {}, logger } = configManager.config

  if (!sourcePath) {
    return FeatureFlag
  }

  const flagDir = normalize(sourcePath)

  const discovered = await discoverFeatureFlagsFromDir(flagDir)
  for (const def of discovered) {
    registerFeatureFlag({
      flag: def as FlagSettings,
      projectConfigFlags,
      router: FeatureFlag,
      logger,
      track: (key) => trackFeatureFlag(key),
    })
  }

  return FeatureFlag
}
