import { MedusaService } from "@medusajs/framework/utils"
import { RbacPolicy, RbacRole, RbacRolePolicy } from "@models"

export default class RbacModuleService extends MedusaService<{
  RbacRole: { dto: any }
  RbacPolicy: { dto: any }
  RbacRolePolicy: { dto: any }
}>({
  RbacRole,
  RbacPolicy,
  RbacRolePolicy,
}) {}
