import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"
import { WorkflowExecution } from "#models/workflow-execution"

export default defineMikroOrmCliConfig(Modules.WORKFLOW_ENGINE, {
  entities: [WorkflowExecution],
})
