export type CreateRbacRoleDTO = {
  name: string
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type UpdateRbacRoleDTO = Partial<CreateRbacRoleDTO> & {
  id: string
}

export type CreateRbacPolicyDTO = {
  key: string
  resource: string
  operation: string
  name?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type UpdateRbacPolicyDTO = Partial<CreateRbacPolicyDTO> & {
  id: string
}

export type CreateRbacRolePolicyDTO = {
  role_id: string
  scope_id: string
  metadata?: Record<string, unknown> | null
}

export type UpdateRbacRolePolicyDTO = Partial<CreateRbacRolePolicyDTO> & {
  id: string
}

export type CreateRbacRoleInheritanceDTO = {
  role_id: string
  inherited_role_id: string
  metadata?: Record<string, unknown> | null
}

export type UpdateRbacRoleInheritanceDTO =
  Partial<CreateRbacRoleInheritanceDTO> & {
    id: string
  }
