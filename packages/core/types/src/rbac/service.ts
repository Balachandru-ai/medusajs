import { FindConfig } from "../common"
import { IModuleService } from "../modules-sdk"
import { Context } from "../shared-context"
import {
  FilterableRbacPolicyProps,
  FilterableRbacRolePolicyProps,
  FilterableRbacRoleProps,
  RbacPolicyDTO,
  RbacRoleDTO,
  RbacRolePolicyDTO,
} from "./common"
import {
  CreateRbacPolicyDTO,
  CreateRbacRoleDTO,
  CreateRbacRolePolicyDTO,
  UpdateRbacPolicyDTO,
  UpdateRbacRoleDTO,
  UpdateRbacRolePolicyDTO,
} from "./mutations"

export interface IRbacModuleService extends IModuleService {
  createRbacRoles(
    data: CreateRbacRoleDTO,
    sharedContext?: Context
  ): Promise<RbacRoleDTO>
  createRbacRoles(
    data: CreateRbacRoleDTO[],
    sharedContext?: Context
  ): Promise<RbacRoleDTO[]>

  updateRbacRoles(
    data: UpdateRbacRoleDTO,
    sharedContext?: Context
  ): Promise<RbacRoleDTO>
  updateRbacRoles(
    data: UpdateRbacRoleDTO[],
    sharedContext?: Context
  ): Promise<RbacRoleDTO[]>

  deleteRbacRoles(
    ids: string | string[],
    sharedContext?: Context
  ): Promise<void>

  retrieveRbacRole(
    id: string,
    config?: FindConfig<RbacRoleDTO>,
    sharedContext?: Context
  ): Promise<RbacRoleDTO>

  listRbacRoles(
    filters?: FilterableRbacRoleProps,
    config?: FindConfig<RbacRoleDTO>,
    sharedContext?: Context
  ): Promise<RbacRoleDTO[]>

  listAndCountRbacRoles(
    filters?: FilterableRbacRoleProps,
    config?: FindConfig<RbacRoleDTO>,
    sharedContext?: Context
  ): Promise<[RbacRoleDTO[], number]>

  createRbacPolicies(
    data: CreateRbacPolicyDTO,
    sharedContext?: Context
  ): Promise<RbacPolicyDTO>
  createRbacPolicies(
    data: CreateRbacPolicyDTO[],
    sharedContext?: Context
  ): Promise<RbacPolicyDTO[]>

  updateRbacPolicies(
    data: UpdateRbacPolicyDTO,
    sharedContext?: Context
  ): Promise<RbacPolicyDTO>
  updateRbacPolicies(
    data: UpdateRbacPolicyDTO[],
    sharedContext?: Context
  ): Promise<RbacPolicyDTO[]>

  deleteRbacPolicies(
    ids: string | string[],
    sharedContext?: Context
  ): Promise<void>

  retrieveRbacPolicy(
    id: string,
    config?: FindConfig<RbacPolicyDTO>,
    sharedContext?: Context
  ): Promise<RbacPolicyDTO>

  listRbacPolicies(
    filters?: FilterableRbacPolicyProps,
    config?: FindConfig<RbacPolicyDTO>,
    sharedContext?: Context
  ): Promise<RbacPolicyDTO[]>

  listAndCountRbacPolicies(
    filters?: FilterableRbacPolicyProps,
    config?: FindConfig<RbacPolicyDTO>,
    sharedContext?: Context
  ): Promise<[RbacPolicyDTO[], number]>

  createRbacRolePolicies(
    data: CreateRbacRolePolicyDTO,
    sharedContext?: Context
  ): Promise<RbacRolePolicyDTO>
  createRbacRolePolicies(
    data: CreateRbacRolePolicyDTO[],
    sharedContext?: Context
  ): Promise<RbacRolePolicyDTO[]>

  updateRbacRolePolicies(
    data: UpdateRbacRolePolicyDTO,
    sharedContext?: Context
  ): Promise<RbacRolePolicyDTO>
  updateRbacRolePolicies(
    data: UpdateRbacRolePolicyDTO[],
    sharedContext?: Context
  ): Promise<RbacRolePolicyDTO[]>

  deleteRbacRolePolicies(
    ids: string | string[],
    sharedContext?: Context
  ): Promise<void>

  retrieveRbacRolePolicy(
    id: string,
    config?: FindConfig<RbacRolePolicyDTO>,
    sharedContext?: Context
  ): Promise<RbacRolePolicyDTO>

  listRbacRolePolicies(
    filters?: FilterableRbacRolePolicyProps,
    config?: FindConfig<RbacRolePolicyDTO>,
    sharedContext?: Context
  ): Promise<RbacRolePolicyDTO[]>

  listAndCountRbacRolePolicies(
    filters?: FilterableRbacRolePolicyProps,
    config?: FindConfig<RbacRolePolicyDTO>,
    sharedContext?: Context
  ): Promise<[RbacRolePolicyDTO[], number]>
}
