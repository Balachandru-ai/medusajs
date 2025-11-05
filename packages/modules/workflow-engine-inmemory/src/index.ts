import { Module, Modules } from "@medusajs/framework/utils"
import { WorkflowsModuleService } from "#services/workflows-module"
import { default as loadUtils } from "#loaders/utils"

export default Module(Modules.WORKFLOW_ENGINE, {
  service: WorkflowsModuleService,
  loaders: [loadUtils],
})
