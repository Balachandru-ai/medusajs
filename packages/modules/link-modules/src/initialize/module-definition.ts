import {
  JoinerRelationship,
  ModuleExports,
  ModuleJoinerConfig,
} from "@medusajs/framework/types"
import {
  getModuleService,
  getReadOnlyModuleService,
} from "#services/dynamic-service-class"
import { getLoaders } from "#loaders/index"

export function getLinkModuleDefinition(
  joinerConfig: ModuleJoinerConfig,
  primary: JoinerRelationship,
  foreign: JoinerRelationship
): ModuleExports {
  return {
    service: joinerConfig.isReadOnlyLink
      ? getReadOnlyModuleService(joinerConfig)
      : getModuleService(joinerConfig),
    loaders: getLoaders({
      joinerConfig,
      primary,
      foreign,
    }),
  }
}
