import { Context, FindConfig } from "@medusajs/framework/types"
import {
  InjectManager,
  MedusaContext,
  MedusaService,
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
