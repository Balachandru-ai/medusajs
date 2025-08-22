import { InputFileConfig } from "@medusajs/types"

const MEDUSA_FILE_CONFIG = "__MEDUSA_FILE_CONFIG__"
/**
 * The "defineFileConfig" helper can be used to define the configuration
 * of any file auto-loaded by Medusa.
 *
 * It is used to avoid loading files that are not required. Like a feature flag
 * that is disabled.
 */
export function defineFileConfig(config?: InputFileConfig) {
  const isEnabled = () => true

  return {
    [MEDUSA_FILE_CONFIG]: {
      isEnabled,
      ...config,
    },
  }
}
