import { MedusaContainer } from "./medusa-container"

/**
 * The configuration accepted by the "defineFileConfig" helper
 */
export type InputFileConfig = {
  isEnabled(container: MedusaContainer): boolean
}
