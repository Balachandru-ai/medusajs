import "./types"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import redisLoader from "./loaders"

export default ModuleProvider(Modules.WORKFLOW_ENGINE, {
  services: [],
  loaders: [redisLoader],
})

export * from "./types"
