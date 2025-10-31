import {
  Context,
  DAL,
  InferEntityType,
  InternalModuleDeclaration,
  ModuleJoinerConfig,
  ModulesSdkTypes,
} from "@medusajs/framework/types"

import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { Tenant, TenantStatus } from "@models"
import { joinerConfig } from "../joiner-config"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  tenantService: ModulesSdkTypes.IMedusaInternalService<any>
}

export interface TenantDTO {
  id: string
  name: string
  slug: string
  subdomain?: string | null
  custom_domain?: string | null
  status: TenantStatus
  default_currency_code: string
  default_region_id?: string | null
  metadata?: Record<string, any> | null
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

export interface CreateTenantDTO {
  name: string
  slug: string
  subdomain?: string
  custom_domain?: string
  status?: TenantStatus
  default_currency_code?: string
  default_region_id?: string
  metadata?: Record<string, any>
}

export interface UpdateTenantDTO {
  name?: string
  slug?: string
  subdomain?: string
  custom_domain?: string
  status?: TenantStatus
  default_currency_code?: string
  default_region_id?: string
  metadata?: Record<string, any>
}

export default class TenantModuleService
  extends MedusaService<{
    Tenant: { dto: TenantDTO }
  }>({
    Tenant,
  })
{
  protected baseRepository_: DAL.RepositoryService
  protected tenantService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof Tenant>
  >

  constructor(
    { baseRepository, tenantService }: InjectedDependencies,
    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    // @ts-ignore
    super(...arguments)

    this.baseRepository_ = baseRepository
    this.tenantService_ = tenantService
  }

  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }

  @InjectManager()
  async createTenants(
    data: CreateTenantDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO>

  @InjectManager()
  async createTenants(
    data: CreateTenantDTO[],
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO[]>

  @InjectManager()
  async createTenants(
    data: CreateTenantDTO | CreateTenantDTO[],
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO | TenantDTO[]> {
    const tenants = await this.createTenants_(data, sharedContext)
    return Array.isArray(data) ? tenants : tenants[0]
  }

  @InjectTransactionManager()
  protected async createTenants_(
    data: CreateTenantDTO | CreateTenantDTO[],
    @MedusaContext() sharedContext?: Context
  ) {
    const dataArray = Array.isArray(data) ? data : [data]
    return await this.tenantService_.create(dataArray, sharedContext)
  }

  @InjectManager()
  async updateTenants(
    id: string,
    data: UpdateTenantDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO>

  @InjectManager()
  async updateTenants(
    selector: { id: string[] },
    data: UpdateTenantDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO[]>

  @InjectManager()
  async updateTenants(
    idOrSelector: string | { id: string[] },
    data: UpdateTenantDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO | TenantDTO[]> {
    const tenants = await this.updateTenants_(idOrSelector, data, sharedContext)
    return typeof idOrSelector === "string" ? tenants[0] : tenants
  }

  @InjectTransactionManager()
  protected async updateTenants_(
    idOrSelector: string | { id: string[] },
    data: UpdateTenantDTO,
    @MedusaContext() sharedContext?: Context
  ) {
    const selector =
      typeof idOrSelector === "string" ? { id: idOrSelector } : idOrSelector
    return await this.tenantService_.update(selector, data, sharedContext)
  }

  @InjectManager()
  async retrieveTenant(
    id: string,
    config?: any,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO> {
    return await this.tenantService_.retrieve(id, config, sharedContext)
  }

  @InjectManager()
  async listTenants(
    filters?: any,
    config?: any,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO[]> {
    return await this.tenantService_.list(filters, config, sharedContext)
  }

  @InjectManager()
  async listAndCountTenants(
    filters?: any,
    config?: any,
    @MedusaContext() sharedContext?: Context
  ): Promise<[TenantDTO[], number]> {
    return await this.tenantService_.listAndCount(filters, config, sharedContext)
  }

  @InjectManager()
  async deleteTenants(
    ids: string | string[],
    @MedusaContext() sharedContext?: Context
  ): Promise<void> {
    await this.deleteTenants_(ids, sharedContext)
  }

  @InjectTransactionManager()
  protected async deleteTenants_(
    ids: string | string[],
    @MedusaContext() sharedContext?: Context
  ) {
    const idArray = Array.isArray(ids) ? ids : [ids]
    await this.tenantService_.delete(idArray, sharedContext)
  }

  /**
   * Retrieve tenant by subdomain
   */
  @InjectManager()
  async retrieveTenantBySubdomain(
    subdomain: string,
    config?: any,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO | null> {
    const [tenants] = await this.tenantService_.list(
      { subdomain },
      { ...config, take: 1 },
      sharedContext
    )
    return tenants[0] || null
  }

  /**
   * Retrieve tenant by custom domain
   */
  @InjectManager()
  async retrieveTenantByCustomDomain(
    customDomain: string,
    config?: any,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO | null> {
    const [tenants] = await this.tenantService_.list(
      { custom_domain: customDomain },
      { ...config, take: 1 },
      sharedContext
    )
    return tenants[0] || null
  }

  /**
   * Retrieve tenant by slug
   */
  @InjectManager()
  async retrieveTenantBySlug(
    slug: string,
    config?: any,
    @MedusaContext() sharedContext?: Context
  ): Promise<TenantDTO | null> {
    const [tenants] = await this.tenantService_.list(
      { slug },
      { ...config, take: 1 },
      sharedContext
    )
    return tenants[0] || null
  }
}
