import { Context } from "@medusajs/framework/types"
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
}
