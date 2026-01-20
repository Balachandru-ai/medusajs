import { asClass } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  Constructor,
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WorkflowOrchestratorService } from "@services"
import { LocalWorkflowsStorage } from "../providers"

const WORKFLOWS_STORAGE_REGISTRATION_KEY = "workflowsStorage"

const registrationFn = async (
  klass: Constructor<any> & { identifier: string },
  container: any,
  { id }: { id: string; options?: Record<string, unknown> }
) => {
  const key = klass.identifier

  if (!id) {
    throw new Error(`No "id" provided for workflows provider ${key}`)
  }

  container.register({
    [WORKFLOWS_STORAGE_REGISTRATION_KEY]: asClass(klass).singleton(),
  })
}

export default async ({
  container,
  options,
}: LoaderOptions<
  (
    | ModulesSdkTypes.ModuleServiceInitializeOptions
    | ModulesSdkTypes.ModuleServiceInitializeCustomDataLayerOptions
  ) & {
    providers?: ModuleProvider[]
  }
>): Promise<void> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  container.register({
    workflowOrchestratorService: asClass(
      WorkflowOrchestratorService
    ).singleton(),
    [WORKFLOWS_STORAGE_REGISTRATION_KEY]: asClass(
      LocalWorkflowsStorage
    ).singleton(),
  })

  if (!options?.providers?.length) {
    logger.info(
      `Workflows module: Using local in-memory storage (no providers configured).`
    )
    return
  }

  if (options.providers?.length > 1) {
    throw new Error(
      `Workflows module: Multiple providers configured: ${options.providers
        .map((p) => p.id)
        .join(", ")}`
    )
  }

  await moduleProviderLoader({
    container,
    providers: options.providers,
    registerServiceFn: registrationFn,
  })
}
