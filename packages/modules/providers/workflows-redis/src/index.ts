import "./types"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { RedisWorkflowsStorage } from "./services"
import redisLoader from "./loaders"

export default ModuleProvider(Modules.WORKFLOW_ENGINE, {
  services: [RedisWorkflowsStorage],
  loaders: [redisLoader],
})

export * from "./types"
