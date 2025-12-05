import { applyTranslations } from "@medusajs/framework/utils"
import {
  createStep,
  StepFunction,
  StepResponse,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

export interface GetTranslatedObjectsStepInput<T> {
  objects: T[] | undefined
  localeCode: string | undefined
}

export const getTranslatedObjectsStepId = "get-translated-objects"

const step = createStep(
  getTranslatedObjectsStepId,
  async (data: GetTranslatedObjectsStepInput<any>, { container }) => {
    await applyTranslations({
      localeCode: data.localeCode,
      objects: data.objects as Record<string, any>[],
      container,
    })

    return new StepResponse(data.objects)
  }
)

export const getTranslatedObjectsStep = <T>(
  data: GetTranslatedObjectsStepInput<T>
): ReturnType<
  StepFunction<GetTranslatedObjectsStepInput<T>, WorkflowData<T[]>>
> => step(data) as unknown as any
