import { Context, FindConfig } from "@medusajs/framework/types"
import {
  InjectManager,
  MedusaContext,
  MedusaService,
  Policy,
} from "@medusajs/framework/utils"
import {
  RbacPolicy,
  RbacRole,
  RbacRoleInheritance,
  RbacRolePolicy,
} from "@models"
import { RbacRepository } from "../repositories"

type InjectedDependencies = {
  rbacRepository: RbacRepository
}

export default class RbacModuleService extends MedusaService<{
  RbacRole: { dto: any }
  RbacPolicy: { dto: any }
  RbacRoleInheritance: { dto: any }
  RbacRolePolicy: { dto: any }
}>({
  RbacRole,
  RbacPolicy,
  RbacRoleInheritance,
  RbacRolePolicy,
}) {
  protected readonly rbacRepository_: RbacRepository

  constructor({ rbacRepository }: InjectedDependencies) {
    // @ts-ignore
    super(...arguments)
    this.rbacRepository_ = rbacRepository
  }

  __hooks = {
    onApplicationStart: async () => {
      this.onApplicationStart()
    },
  }

  async onApplicationStart(): Promise<void> {
    await this.syncRegisteredPolicies()
  }

  @InjectManager()
  private async syncRegisteredPolicies(
    @MedusaContext() sharedContext: Context = {}
  ): Promise<void> {
    const registeredPolicies = Array.from(Policy.entries()).map(
      ([name, { resource, operation }]) => ({
        key: `${resource}:${operation}`,
        name,
        resource,
        operation,
      })
    )

    if (registeredPolicies.length === 0) {
      return
    }

    const registeredKeys = registeredPolicies.map((p) => p.key)

    // Fetch all existing policies (including soft-deleted ones)
    const existingPolicies = await this.listRbacPolicies(
      {},
      { withDeleted: true },
      sharedContext
    )

    const existingPoliciesMap = new Map(existingPolicies.map((p) => [p.key, p]))

    const policiesToCreate: any[] = []
    const policiesToUpdate: any[] = []
    const policiesToRestore: string[] = []

    // Process registered policies
    for (const registeredPolicy of registeredPolicies) {
      const existing = existingPoliciesMap.get(registeredPolicy.key)

      if (!existing) {
        policiesToCreate.push(registeredPolicy)
      } else if (existing.deleted_at) {
        policiesToRestore.push(existing.id)
        // Update in case name changed
        if (existing.name !== registeredPolicy.name) {
          policiesToUpdate.push({
            id: existing.id,
            name: registeredPolicy.name,
          })
        }
      } else if (existing.name !== registeredPolicy.name) {
        // Existing policy with different name - update it
        policiesToUpdate.push({
          id: existing.id,
          name: registeredPolicy.name,
        })
      }
    }

    const policiesToSoftDelete = existingPolicies
      .filter((p) => !p.deleted_at && !registeredKeys.includes(p.key))
      .map((p) => p.id)

    // Execute updates
    if (policiesToRestore.length > 0) {
      await this.restoreRbacPolicies(policiesToRestore, {}, sharedContext)
    }

    if (policiesToCreate.length > 0) {
      await this.createRbacPolicies(policiesToCreate, sharedContext)
    }

    if (policiesToUpdate.length > 0) {
      await this.updateRbacPolicies(policiesToUpdate, sharedContext)
    }

    if (policiesToSoftDelete.length > 0) {
      await this.softDeleteRbacPolicies(policiesToSoftDelete, {}, sharedContext)
    }
  }

  @InjectManager()
  async listPoliciesForRole(
    roleId: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<any[]> {
    return await this.rbacRepository_.listPoliciesForRole(roleId, sharedContext)
  }

  @InjectManager()
  // @ts-expect-error
  async listRbacRoles(
    filters: any = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<any[]> {
    const roles = await super.listRbacRoles(filters, config, sharedContext)

    const shouldIncludePolicies =
      config.relations?.includes("policies") ||
      config.select?.includes("policies")

    if (shouldIncludePolicies && roles.length > 0) {
      const roleIds = roles.map((role) => role.id)
      const policiesByRole = await this.rbacRepository_.listPoliciesForRoles(
        roleIds,
        sharedContext
      )

      for (const role of roles) {
        role.policies = policiesByRole.get(role.id) || []
      }
    }

    return roles
  }

  @InjectManager()
  // @ts-expect-error
  async listAndCountRbacRoles(
    filters: any = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<[any[], number]> {
    const [roles, count] = await super.listAndCountRbacRoles(
      filters,
      config,
      sharedContext
    )

    const shouldIncludePolicies =
      config.relations?.includes("policies") ||
      config.select?.includes("policies")

    if (shouldIncludePolicies && roles.length > 0) {
      const roleIds = roles.map((role) => role.id)
      const policiesByRole = await this.rbacRepository_.listPoliciesForRoles(
        roleIds,
        sharedContext
      )

      for (const role of roles) {
        role.policies = policiesByRole.get(role.id) || []
      }
    }

    return [roles, count]
  }
}
