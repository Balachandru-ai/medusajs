export * from "./config"
export * from "./container"
export * from "./database"
export * from "./feature-flags"
export * from "./http"
export * from "./jobs"
export * from "./links"
export * from "./logger"
export * from "./medusa-app-loader"
export * from "./subscribers"
export * from "./workflows"
export * from "./telemetry"
export * from "./zod"
export * from "./migrations"

// CLI path - optional in production bundles
export const MEDUSA_CLI_PATH = (() => {
  try {
    return require.resolve("@medusajs/cli")
  } catch {
    // CLI not available in production bundle - that's ok
    return undefined
  }
})()

export { Query } from "@medusajs/modules-sdk"
