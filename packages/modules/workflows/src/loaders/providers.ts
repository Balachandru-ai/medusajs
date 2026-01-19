import { aliasTo, asClass, Lifetime } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  getProviderRegistrationKey,
} from "@medusajs/framework/utils"
import { LocalWorkflowsStorage } from "../utils"
import { WorkflowOrchestratorService } from "@services"

const WORKFLOWS_STORAGE_REGISTRATION_KEY = "workflowsStorage"

const registrationFn = async (
  klass: { identifier: string },
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

  // Provider service is registered by moduleProviderLoader via load-internal.ts.
  // Create an alias for the storage registration key so the orchestrator can resolve it.
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
    [WORKFLOWS_STORAGE_REGISTRATION_KEY]: asClass(LocalWorkflowsStorage, {
      lifetime: Lifetime.SINGLETON,
    }),
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
