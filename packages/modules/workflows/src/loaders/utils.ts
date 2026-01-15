import { asClass } from "@medusajs/framework/awilix"
import { WorkflowOrchestratorService } from "../services"
import { LocalWorkflowsStorage } from "../utils"

export default async ({ container }): Promise<void> => {
  container.register({
    workflowsStorage: asClass(LocalWorkflowsStorage).singleton(),
    workflowOrchestratorService: asClass(
      WorkflowOrchestratorService
    ).singleton(),
  })
}
