import {
  CreateViewConfigurationDTO,
  ViewConfigurationDTO,
} from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  when,
} from "@medusajs/framework/workflows-sdk"
import {
  createViewConfigurationStep,
  setActiveViewConfigurationStep,
} from "../steps"

export type CreateViewConfigurationWorkflowInput =
  CreateViewConfigurationDTO & {
    set_active?: boolean
  }

export const createViewConfigurationWorkflowId = "create-view-configuration"

/**
 * @ignore
 * 
 * @privateRemarks
 * Remove the `ignore` tag once the feature is ready. Otherwise,
 * it will be generated in the documentation.
 */
export const createViewConfigurationWorkflow = createWorkflow(
  createViewConfigurationWorkflowId,
  (
    input: WorkflowData<CreateViewConfigurationWorkflowInput>
  ): WorkflowResponse<ViewConfigurationDTO> => {
    const viewConfig = createViewConfigurationStep(input)

    when({ input, viewConfig }, ({ input }) => {
      return !!input.set_active && !!input.user_id
    }).then(() => {
      setActiveViewConfigurationStep({
        id: viewConfig.id,
        entity: viewConfig.entity,
        user_id: input.user_id as string,
      })
    })

    return new WorkflowResponse(viewConfig)
  }
)
