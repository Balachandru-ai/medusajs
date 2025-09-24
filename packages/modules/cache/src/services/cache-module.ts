import { MedusaModule } from "@medusajs/framework/modules-sdk"
import type {
  ICachingModuleService,
  ICachingStrategy,
} from "@medusajs/framework/types"
import { GraphQLUtils, MedusaError } from "@medusajs/framework/utils"
import { CachingDefaultProvider, ModuleInjectedDependencies } from "@types"
import CacheProviderService from "./cache-provider"

const ONE_HOUR_IN_SECOND = 60 * 60 * 100

export default class CachingModuleService implements ICachingModuleService {
  #container: ModuleInjectedDependencies
  #providerService: CacheProviderService
  #defaultStrategyCtr: new (...args: any[]) => ICachingStrategy
  #defaultStrategy: ICachingStrategy
  #defaultProviderId: string

  #ttl: number

  constructor(
    container: ModuleInjectedDependencies,
    protected readonly moduleDeclaration:
      | { options: { ttl?: number } }
      | { ttl?: number }
  ) {
    this.#container = container
    this.#providerService = container.cacheProviderService
    this.#defaultProviderId = container[CachingDefaultProvider]
    this.#defaultStrategyCtr = container.strategy as new (
      ...args: any[]
    ) => ICachingStrategy

    const moduleOptions =
      "options" in moduleDeclaration
        ? moduleDeclaration.options
        : moduleDeclaration

    this.#ttl = moduleOptions.ttl ?? ONE_HOUR_IN_SECOND
  }

  __hooks = {
    onApplicationStart: async () => {
      this.#onApplicationStart()
    },
  }

  #onApplicationStart() {
    this.#defaultStrategy = new this.#defaultStrategyCtr(
      this.#container,
      MedusaModule.getAllJoinerConfigs(),
      this
    )

    const loadedSchema = MedusaModule.getAllJoinerConfigs()
      .map((joinerConfig) => joinerConfig?.schema ?? "")
      .join("\n")

    const defaultMedusaSchema = `
    scalar DateTime
    scalar JSON
    directive @enumValue(value: String) on ENUM_VALUE
  `

    const { schema: cleanedSchema } = GraphQLUtils.cleanGraphQLSchema(
      defaultMedusaSchema + loadedSchema
    )
    const mergedSchema = GraphQLUtils.mergeTypeDefs(cleanedSchema)
    const schema = GraphQLUtils.makeExecutableSchema({
      typeDefs: mergedSchema,
    })

    this.#defaultStrategy.onApplicationStart?.(this.#container, schema, this)
  }

  #normalizeProviders(
    providers:
      | string[]
      | { id: string; ttl?: number }
      | { id: string; ttl?: number }[]
  ): { id: string; ttl?: number }[] {
    const providers_ = Array.isArray(providers) ? providers : [providers]
    return providers_.map((provider) => {
      return typeof provider === "string" ? { id: provider } : provider
    })
  }

  async get({
    key,
    tags,
    provider,
  }: {
    key?: string
    tags?: string[]
    provider?: string
  }) {
    if (!key && !tags) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Either key or tags must be provided"
      )
    }

    const provider_ = this.#providerService.retrieveProvider(
      provider ?? this.#defaultProviderId
    )
    return await provider_.get({ key, tags })
  }

  async set({
    key,
    data,
    ttl,
    tags,
    providers,
    options,
  }: {
    key: string
    data: object
    tags?: string[]
    ttl?: number
    providers?:
      | string[]
      | {
          id: string
          ttl?: number
        }
      | { id: string; ttl?: number }[]
    options?: {
      noAutoInvalidation?: boolean
    }
  }) {
    const key_ = key ?? this.#defaultStrategy.computeKey(data)
    const tags_ = tags ?? (await this.#defaultStrategy.computeTags(data))

    let providers_: string[] | { id: string; ttl?: number }[] = [
      { id: this.#defaultProviderId },
    ]
    providers_ = this.#normalizeProviders(providers ?? providers_)

    for (const providerOptions of providers_) {
      const ttl_ = providerOptions.ttl ?? ttl ?? this.#ttl
      const provider = this.#providerService.retrieveProvider(
        providerOptions.id
      )
      await provider.set({
        key: key_,
        tags: tags_,
        data,
        ttl: ttl_,
        options,
      })
    }
  }

  async clear({
    key,
    tags,
    options,
    providers,
  }: {
    key?: string
    tags?: string[]
    options?: {
      noAutoInvalidation?: boolean
    }
    providers?: string | string[]
  }) {
    if (!key && !tags) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Either key or tags must be provided"
      )
    }

    let providerIds_: string[] = [this.#defaultProviderId]
    if (providers) {
      providerIds_ = Array.isArray(providers) ? providers : [providers]
    }

    for (const providerId of providerIds_) {
      const provider = this.#providerService.retrieveProvider(providerId)
      await provider.clear({ key, tags, options })
    }
  }

  async computeKey(input: object): Promise<string> {
    return await this.#defaultStrategy.computeKey(input)
  }

  async computeTags(
    input: object,
    options?: Record<string, any>
  ): Promise<string[]> {
    return await this.#defaultStrategy.computeTags(input, options)
  }
}
