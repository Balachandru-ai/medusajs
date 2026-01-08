import {
  createWorkflow,
  parallelize,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  UpdateTranslationSettingsDTO,
  CreateTranslationSettingsDTO,
} from "@medusajs/types"
import {
  createTranslationSettingsStep,
  deleteTranslationSettingsStep,
  updateTranslationSettingsStep,
} from "../steps"

export const batchTranslationSettingsWorkflowId = "batch-translation-settings"

export interface BatchTranslationSettingsWorkflowInput {
  create: CreateTranslationSettingsDTO[]
  update: UpdateTranslationSettingsDTO[]
  delete: string[]
}

export const batchTranslationSettingsWorkflow = createWorkflow(
  batchTranslationSettingsWorkflowId,
  (input: BatchTranslationSettingsWorkflowInput) => {
    // TODO: Include a validateTranslationSettingsStep here to make sure update/create entity_type belong
    // to translatable entities, once DML PR is done
    const [created, updated, deleted] = parallelize(
      createTranslationSettingsStep(input.create),
      updateTranslationSettingsStep(input.update),
      deleteTranslationSettingsStep(input.delete)
    )

    return new WorkflowResponse(
      transform({ created, updated, deleted }, (data) => data)
    )
  }
)
