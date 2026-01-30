import { DeleteResponse, PaginatedResponse } from "../../common"
import { AdminRbacPolicy, AdminRbacRole } from "./entities"
import { AdminUser } from "../../user"

export interface AdminRbacRoleResponse {
  /**
   * The role's details.
   */
  role: AdminRbacRole
}

export interface AdminRbacRoleListResponse
  extends PaginatedResponse<{
    /**
     * The list of roles.
     */
    roles: AdminRbacRole[]
  }> { }

export interface AdminRbacRoleDeleteResponse
  extends DeleteResponse<"rbac_role"> { }

export interface AdminRbacPolicyResponse {
  /**
   * The policy's details.
   */
  policy: AdminRbacPolicy
}

export interface AdminRbacPolicyListResponse
  extends PaginatedResponse<{
    /**
     * The list of policies.
     */
    policies: AdminRbacPolicy[]
  }> { }

export interface AdminRbacPolicyDeleteResponse
  extends DeleteResponse<"rbac_policy"> { }

export interface AdminRbacRoleUserListResponse
  extends PaginatedResponse<{
    /**
     * The list of users.
     */
    users: AdminUser[]
  }> { }
