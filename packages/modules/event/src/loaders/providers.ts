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
import { EventProviderService } from "@services"
import {
  EventDefaultProvider,
  EventIdentifiersRegistrationName,
  EventProviderRegistrationPrefix,
} from "@types"
import {
  Lifetime,
  aliasTo,
  asFunction,
  asValue,
} from "@medusajs/framework/awilix"
import { LocalEventProvider } from "../providers/local"

const registrationFn = async (klass, container, { id }) => {
  const key = EventProviderService.getRegistrationIdentifier(klass)

  if (!id) {
    throw new Error(`No "id" provided for provider ${key}`)
  }

  const regKey = getProviderRegistrationKey({
    providerId: id,
    providerIdentifier: key,
  })

  // Provider service is already registered by load-internal.ts when loadingProviders: true.
  // We only need to create an alias for easier access.
  container.register({
    [EventProviderRegistrationPrefix + id]: aliasTo(regKey),
  })

  container.registerAdd(EventIdentifiersRegistrationName, asValue(key))
}

export default async ({
  container,
  options,
}: LoaderOptions<
  (
    | ModulesSdkTypes.ModuleServiceInitializeOptions
    | ModulesSdkTypes.ModuleServiceInitializeCustomDataLayerOptions
  ) & { providers: ModuleProvider[] }
>): Promise<void> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  container.registerAdd(EventIdentifiersRegistrationName, asValue(undefined))

  // LocalEventProvider - default built-in provider
  container.register({
    [EventProviderRegistrationPrefix + LocalEventProvider.identifier]:
      asFunction((cradle) => new LocalEventProvider(cradle), {
        lifetime: Lifetime.SINGLETON,
      }),
  })
  container.registerAdd(
    EventIdentifiersRegistrationName,
    asValue(LocalEventProvider.identifier)
  )
  container.register(
    EventDefaultProvider,
    asValue(LocalEventProvider.identifier)
  )

  // Load other providers
  await moduleProviderLoader({
    container,
    providers: options?.providers || [],
    registerServiceFn: registrationFn,
  })

  const defaults: ModuleProvider[] = []

  const isSingleProvider = options?.providers?.length === 1
  let hasDefaultProvider = false
  for (const provider of options?.providers || []) {
    if (provider.is_default || isSingleProvider) {
      if (provider.is_default) {
        hasDefaultProvider = true
        defaults.push(provider)
      }
      container.register(EventDefaultProvider, asValue(provider.id))
    }
  }

  if (defaults.length > 1) {
    throw new Error(
      `[event-module] Multiple default providers found: ${defaults
        .map((provider) => provider.id)
        .join(", ")}`
    )
  }

  if (!hasDefaultProvider) {
    logger.info(
      `Event module: Using "${container.resolve(
        EventDefaultProvider
      )}" as default.`
    )
  }
}
