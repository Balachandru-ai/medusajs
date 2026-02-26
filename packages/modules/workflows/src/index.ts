import { Module, Modules } from "@medusajs/framework/utils"
import { WorkflowsModuleService } from "@services"
import { loadProviders } from "./loaders"

export default Module(Modules.WORKFLOW_ENGINE, {
  service: WorkflowsModuleService,
  loaders: [loadProviders],
})

export * from "./services"
export * from "./types"
export * from "./utils"
