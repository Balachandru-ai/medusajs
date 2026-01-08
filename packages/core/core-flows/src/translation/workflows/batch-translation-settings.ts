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
