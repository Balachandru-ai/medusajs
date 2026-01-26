import {
  Context,
  DAL,
  HttpTypes,
  InferEntityType,
  InternalModuleDeclaration,
  ModulesSdkTypes,
  SettingsTypes,
} from "@medusajs/framework/types"
import {
  EmitEvents,
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"
import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ViewConfiguration, UserPreference, PropertyLabel } from "@/models"
import {
  EntityDiscoveryService,
  generateEntityColumns,
  hasEntityOverride,
  PropertyLabel as PropertyLabelType,
} from "@/utils"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  viewConfigurationService: ModulesSdkTypes.IMedusaInternalService<any>
}

export default class SettingsModuleService
  extends MedusaService<{
    ViewConfiguration: { dto: SettingsTypes.ViewConfigurationDTO }
    UserPreference: { dto: SettingsTypes.UserPreferenceDTO }
    PropertyLabel: { dto: SettingsTypes.PropertyLabelDTO }
  }>({ ViewConfiguration, UserPreference, PropertyLabel })
  implements SettingsTypes.ISettingsModuleService
{
  protected baseRepository_: DAL.RepositoryService
  // viewConfigurationService_ is needed for special JSON update handling (upsertWithReplace)
  protected readonly viewConfigurationService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof ViewConfiguration>
  >
  protected entityDiscoveryService_: EntityDiscoveryService

  constructor(
    { baseRepository, viewConfigurationService }: InjectedDependencies,
    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.viewConfigurationService_ = viewConfigurationService
    this.entityDiscoveryService_ = new EntityDiscoveryService()
  }

  __hooks = {
    onApplicationStart: async () => {
      // Initialize entity discovery with joiner configs
      const joinerConfigs = MedusaModule.getAllJoinerConfigs()
      this.entityDiscoveryService_.initialize(joinerConfigs)
    },
  }

  @InjectManager()
  @EmitEvents()
  // @ts-expect-error
  async createViewConfigurations(
    data:
      | SettingsTypes.CreateViewConfigurationDTO
      | SettingsTypes.CreateViewConfigurationDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<
    SettingsTypes.ViewConfigurationDTO | SettingsTypes.ViewConfigurationDTO[]
  > {
    // Convert to array for validation only
    const isArrayInput = Array.isArray(data)
    const dataArray = isArrayInput ? data : [data]

    // Validate system defaults
    for (const config of dataArray) {
      if (config.is_system_default && config.user_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "System default view configurations cannot have a user_id"
        )
      }

      if (config.is_system_default) {
        // Check if a system default already exists for this entity
        const existingDefault = await this.viewConfigurationService_.list(
          {
            entity: config.entity,
            is_system_default: true,
          },
          { select: ["id"] },
          sharedContext
        )

        if (existingDefault.length > 0) {
          throw new MedusaError(
            MedusaError.Types.DUPLICATE_ERROR,
            `A system default view configuration already exists for entity: ${config.entity}`
          )
        }
      }
    }

    const result = await super.createViewConfigurations(
      dataArray,
      sharedContext
    )

    return await this.baseRepository_.serialize<
      SettingsTypes.ViewConfigurationDTO[] | SettingsTypes.ViewConfigurationDTO
    >(isArrayInput ? result : result[0])
  }

  @InjectManager()
  @EmitEvents()
  // @ts-expect-error
  async updateViewConfigurations(
    idOrSelector: string | SettingsTypes.FilterableViewConfigurationProps,
    data: SettingsTypes.UpdateViewConfigurationDTO,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<
    SettingsTypes.ViewConfigurationDTO | SettingsTypes.ViewConfigurationDTO[]
  > {
    const updated = await this.updateViewConfigurations_(
      idOrSelector,
      data,
      sharedContext
    )

    const serialized = await this.baseRepository_.serialize<
      SettingsTypes.ViewConfigurationDTO[] | SettingsTypes.ViewConfigurationDTO
    >(updated)

    return typeof idOrSelector === "string" ? serialized[0] : serialized
  }

  @InjectTransactionManager()
  protected async updateViewConfigurations_(
    idOrSelector: string | SettingsTypes.FilterableViewConfigurationProps,
    data: SettingsTypes.UpdateViewConfigurationDTO,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof ViewConfiguration>[]> {
    let selector: SettingsTypes.FilterableViewConfigurationProps = {}

    if (typeof idOrSelector === "string") {
      selector = { id: idOrSelector }
    } else {
      selector = idOrSelector
    }

    // Special handling for configuration updates to ensure replacement instead of merge
    if (data.configuration) {
      // First, get the entities to update
      const entities = await this.viewConfigurationService_.list(
        selector,
        {},
        sharedContext
      )

      if (entities.length === 0) {
        return typeof idOrSelector === "string" ? [] : []
      }

      // Use upsertWithReplace to update the configuration field without merging
      const updateDataArray = entities.map((entity) => ({
        id: entity.id,
        ...data,
        configuration: {
          visible_columns: data.configuration?.visible_columns ?? [],
          column_order: data.configuration?.column_order ?? [],
          column_widths:
            data.configuration?.column_widths !== undefined
              ? data.configuration.column_widths
              : {},
          filters:
            data.configuration?.filters !== undefined
              ? data.configuration.filters
              : {},
          sorting:
            data.configuration?.sorting !== undefined
              ? data.configuration.sorting
              : null,
          search:
            data.configuration?.search !== undefined
              ? data.configuration.search
              : "",
        },
      }))

      // Use upsertWithReplace which uses nativeUpdateMany internally and doesn't merge JSON fields
      const { entities: updatedEntities } =
        await this.viewConfigurationService_.upsertWithReplace(
          updateDataArray,
          { relations: [] },
          sharedContext
        )

      return updatedEntities
    }

    // For non-configuration updates, use the standard update method
    const updated = await this.viewConfigurationService_.update(
      { selector, data },
      sharedContext
    )

    return updated as unknown as InferEntityType<typeof ViewConfiguration>[]
  }

  // Note: createUserPreferences, updateUserPreferences, deleteUserPreferences, listUserPreferences,
  // listAndCountUserPreferences, and retrieveUserPreference are auto-generated by MedusaService

  @InjectManager()
  async getUserPreference(
    userId: string,
    key: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SettingsTypes.UserPreferenceDTO | null> {
    const prefs = await this.listUserPreferences(
      { user_id: userId, key },
      { take: 1 },
      sharedContext
    )
    return prefs.length > 0 ? prefs[0] : null
  }

  @InjectManager()
  @EmitEvents()
  async setUserPreference(
    userId: string,
    key: string,
    value: any,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SettingsTypes.UserPreferenceDTO> {
    const existing = await this.listUserPreferences(
      { user_id: userId, key },
      { take: 1, select: ["id"] },
      sharedContext
    )

    if (existing.length > 0) {
      const [updated] = await this.updateUserPreferences(
        [{ id: existing[0].id, value }],
        sharedContext
      )
      return updated
    } else {
      const created = await this.createUserPreferences(
        { user_id: userId, key, value },
        sharedContext
      )
      return Array.isArray(created) ? created[0] : created
    }
  }

  @InjectManager()
  async getActiveViewConfiguration(
    entity: string,
    userId: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SettingsTypes.ViewConfigurationDTO | null> {
    // Check if user has an active view preference
    const activeViewPref = await this.getUserPreference(
      userId,
      `active_view.${entity}`,
      sharedContext
    )

    // Check if we have a preference with a view configuration ID (not explicitly null)
    if (
      activeViewPref &&
      activeViewPref.value?.viewConfigurationId &&
      activeViewPref.value.viewConfigurationId !== null
    ) {
      try {
        return await this.retrieveViewConfiguration(
          activeViewPref.value.viewConfigurationId,
          {},
          sharedContext
        )
      } catch (error) {
        // View configuration might have been deleted
      }
    }

    // If we have an explicit null preference, or no preference, or a deleted view
    // We should check for defaults in this order:

    // Check if user has any personal views (only if no explicit null preference)
    if (!activeViewPref || activeViewPref.value?.viewConfigurationId !== null) {
      const [personalView] = await this.listViewConfigurations(
        { entity, user_id: userId },
        { take: 1, order: { created_at: "ASC" } },
        sharedContext
      )

      if (personalView) {
        return personalView
      }
    }

    // Fall back to system default
    const systemDefaults = await this.listViewConfigurations(
      { entity, is_system_default: true },
      {},
      sharedContext
    )

    return systemDefaults.length > 0 ? systemDefaults[0] : null
  }

  @InjectManager()
  @EmitEvents()
  async setActiveViewConfiguration(
    entity: string,
    userId: string,
    viewConfigurationId: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<void> {
    // Verify the view configuration exists and user has access
    const viewConfig = await this.retrieveViewConfiguration(
      viewConfigurationId,
      {},
      sharedContext
    )

    if (viewConfig.entity !== entity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `View configuration ${viewConfigurationId} is not for entity ${entity}`
      )
    }

    if (viewConfig.user_id && viewConfig.user_id !== userId) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `User ${userId} does not have access to view configuration ${viewConfigurationId}`
      )
    }

    await this.setUserPreference(
      userId,
      `active_view.${entity}`,
      { viewConfigurationId },
      sharedContext
    )
  }

  @InjectManager()
  async getSystemDefaultViewConfiguration(
    entity: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SettingsTypes.ViewConfigurationDTO | null> {
    const systemDefaults = await this.listViewConfigurations(
      { entity, is_system_default: true },
      {},
      sharedContext
    )

    return systemDefaults.length > 0 ? systemDefaults[0] : null
  }

  @InjectManager()
  @EmitEvents()
  async clearActiveViewConfiguration(
    entity: string,
    userId: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<void> {
    // Instead of deleting, set the preference to null
    // This ensures we're using the same transaction pattern as setActiveViewConfiguration
    await this.setUserPreference(
      userId,
      `active_view.${entity}`,
      { viewConfigurationId: null },
      sharedContext
    )
  }

  // Property Label methods
  // Note: createPropertyLabels, updatePropertyLabels, deletePropertyLabels, listPropertyLabels,
  // listAndCountPropertyLabels, and retrievePropertyLabel are auto-generated by MedusaService

  @InjectManager()
  async getPropertyLabels(
    entity: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SettingsTypes.PropertyLabelDTO[]> {
    return await this.listPropertyLabels({ entity }, {}, sharedContext)
  }

  @InjectManager()
  async getPropertyLabel(
    entity: string,
    property: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SettingsTypes.PropertyLabelDTO | null> {
    const labels = await this.listPropertyLabels(
      { entity, property },
      { take: 1 },
      sharedContext
    )
    return labels.length > 0 ? labels[0] : null
  }

  @InjectManager()
  @EmitEvents()
  async upsertPropertyLabel(
    data: SettingsTypes.UpsertPropertyLabelDTO,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SettingsTypes.PropertyLabelDTO> {
    // Check if a label already exists for this entity.property
    const existing = await this.listPropertyLabels(
      { entity: data.entity, property: data.property },
      { take: 1, select: ["id"] },
      sharedContext
    )

    if (existing.length > 0) {
      // Update existing label
      const [updated] = await this.updatePropertyLabels(
        [{ id: existing[0].id, label: data.label, description: data.description }],
        sharedContext
      )
      return updated
    } else {
      // Create new label
      const created = await this.createPropertyLabels(
        {
          entity: data.entity,
          property: data.property,
          label: data.label,
          description: data.description,
        },
        sharedContext
      )
      return Array.isArray(created) ? created[0] : created
    }
  }

  @InjectManager()
  @EmitEvents()
  async deletePropertyLabel(
    entity: string,
    property: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<void> {
    const labels = await this.listPropertyLabels(
      { entity, property },
      { take: 1, select: ["id"] },
      sharedContext
    )

    if (labels.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Property label for ${entity}.${property} not found`
      )
    }

    await this.deletePropertyLabels(labels[0].id, sharedContext)
  }

  // Entity Discovery and Column Generation methods

  /**
   * Check if entity discovery has been initialized.
   */
  isEntityDiscoveryInitialized(): boolean {
    return this.entityDiscoveryService_.isInitialized()
  }

  /**
   * List all discoverable entities.
   */
  listDiscoverableEntities(): HttpTypes.AdminEntityInfo[] {
    if (!this.entityDiscoveryService_.isInitialized()) {
      return []
    }

    const entities = this.entityDiscoveryService_.discoverEntities()

    return entities.map((entity) =>
      this.entityDiscoveryService_.getEntityInfo(
        entity,
        hasEntityOverride(entity.name)
      )
    )
  }

  /**
   * Check if an entity exists by name.
   */
  hasEntity(name: string): boolean {
    return this.entityDiscoveryService_.hasEntity(name)
  }

  /**
   * Generate columns for an entity.
   */
  @InjectManager()
  async generateEntityColumns(
    entityKey: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<HttpTypes.AdminColumn[] | null> {
    if (!this.entityDiscoveryService_.isInitialized()) {
      return null
    }

    // Get entity info
    const entity = this.entityDiscoveryService_.getEntity(entityKey)
    if (!entity) {
      return null
    }

    // Fetch property labels for the entity
    const labels = await this.getPropertyLabels(entity.name, sharedContext)

    // Convert to Map for quick lookup
    const propertyLabelsMap = new Map<string, PropertyLabelType>()
    for (const label of labels) {
      propertyLabelsMap.set(label.property, {
        id: label.id,
        entity: label.entity,
        property: label.property,
        label: label.label,
        description: label.description,
      })
    }

    // Generate columns using the utility
    return generateEntityColumns(
      this.entityDiscoveryService_,
      entityKey,
      propertyLabelsMap
    )
  }
}
