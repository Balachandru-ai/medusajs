import { FlagSettings } from "@medusajs/framework/feature-flags"

const BackendHmrFeatureFlag: FlagSettings = {
  key: "backend_hmr",
  default_val: false,
  env_key: "MEDUSA_FF_BACKEND_HMR",
  description:
    "Enable experimental Vite-based Hot Module Replacement for backend development. " +
    "When enabled, route, middleware, and subscriber changes reload in <100ms without restarting the server. " +
    "Database connections and container state persist across reloads.",
}

export default BackendHmrFeatureFlag
