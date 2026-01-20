import { aliasTo, asClass } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  Constructor,
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  getProviderRegistrationKey,
} from "@medusajs/framework/utils"
import { WorkflowOrchestratorService } from "@services"
import { LocalWorkflowsStorage } from "../providers"

export const WORKFLOWS_STORAGE_REGISTRATION_KEY = "workflowsStorage"

const registrationFn = async (
  klass: Constructor<any> & { identifier: string },
  container: any,
  { id }: { id: string; options?: Record<string, unknown> }
) => {
  const key = klass.identifier

  if (!id) {
    throw new Error(`No "id" provided for workflows provider ${key}`)
  }

  const regKey = getProviderRegistrationKey({
    providerId: id,
    providerIdentifier: key,
  })

  container.register({
    [WORKFLOWS_STORAGE_REGISTRATION_KEY]: aliasTo(regKey),
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
  })

  if (!options?.providers?.length) {
    logger.info(
      `Workflows module: Using local in-memory storage (no providers configured).`
    )

    container.register({
      [WORKFLOWS_STORAGE_REGISTRATION_KEY]: asClass(
        LocalWorkflowsStorage
      ).singleton(),
    })
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
