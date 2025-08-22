import { InputFileConfig } from "@medusajs/types"

export const MEDUSA_FILE_CONFIG = "__MEDUSA_FILE_CONFIG__"
export const MEDUSA_SKIP_FILE = Symbol.for("__MEDUSA_SKIP_FILE__")
/**
 * The "defineFileConfig" helper can be used to define the configuration
 * of any file auto-loaded by Medusa.
 *
 * It is used to avoid loading files that are not required. Like a feature flag
 * that is disabled.
 */
export function defineFileConfig(config?: InputFileConfig) {
  return {
    [MEDUSA_FILE_CONFIG]: {
      ...config,
    },
  }
}
