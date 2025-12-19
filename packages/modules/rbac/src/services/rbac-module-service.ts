import { Context, FindConfig } from "@medusajs/framework/types"
import {
  InjectManager,
  MedusaContext,
  MedusaService,
  Policy,
} from "@medusajs/framework/utils"
import { RbacPolicy, RbacRole, RbacRoleParent, RbacRolePolicy } from "@models"
import { RbacRepository } from "../repositories"

type InjectedDependencies = {
  rbacRepository: RbacRepository
}

export default class RbacModuleService extends MedusaService<{
  RbacRole: { dto: any }
  RbacPolicy: { dto: any }
  RbacRoleParent: { dto: any }
  RbacRolePolicy: { dto: any }
}>({
  RbacRole,
  RbacPolicy,
  RbacRoleParent,
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
    const registeredPolicies = Object.entries(Policy).map(
      ([name, { resource, operation, description }]) => ({
        key: `${resource}:${operation}`,
        name,
        resource,
        operation,
        description,
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
      } else if (
        existing.name !== registeredPolicy.name ||
        existing.description !== registeredPolicy.description
      ) {
        // Existing policy with different name - update it
        policiesToUpdate.push({
          id: existing.id,
          name: registeredPolicy.name,
          description: registeredPolicy.description,
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

  @InjectManager()
  // @ts-expect-error
  async createRbacRoleParents(
    data: any[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<any[]> {
    for (const parent of data) {
      const { role_id, parent_id } = parent

      if (role_id === parent_id) {
        throw new Error(
          `Cannot create role parent relationship: a role cannot be its own parent (role_id: ${role_id})`
        )
      }

      const wouldCreateCycle = await this.rbacRepository_.checkForCycle(
        role_id,
        parent_id,
        sharedContext
      )

      if (wouldCreateCycle) {
        throw new Error(
          `Cannot create role parent relationship: this would create a circular dependency (role_id: ${role_id}, parent_id: ${parent_id})`
        )
      }
    }

    return await super.createRbacRoleParents(data, sharedContext)
  }

  @InjectManager()
  // @ts-expect-error
  async updateRbacRoleParents(
    data: any[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<any[]> {
    for (const parent of data) {
      const { role_id, parent_id } = parent

      if (parent_id) {
        if (role_id === parent_id) {
          throw new Error(
            `Cannot update role parent relationship: a role cannot be its own parent (role_id: ${role_id})`
          )
        }

        const wouldCreateCycle = await this.rbacRepository_.checkForCycle(
          role_id,
          parent_id,
          sharedContext
        )

        if (wouldCreateCycle) {
          throw new Error(
            `Cannot update role parent relationship: this would create a circular dependency (role_id: ${role_id}, parent_id: ${parent_id})`
          )
        }
      }
    }

    return await super.updateRbacRoleParents(data, sharedContext)
  }
}
