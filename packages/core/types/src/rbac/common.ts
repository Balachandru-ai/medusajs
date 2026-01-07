export type RbacRoleDTO = {
  id: string
  name: string
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type FilterableRbacRoleProps = {
  id?: string | string[]
  name?: string
  q?: string
}

export type RbacPolicyDTO = {
  id: string
  key: string
  resource: string
  operation: string
  name?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type FilterableRbacPolicyProps = {
  id?: string | string[]
  key?: string
  resource?: string
  operation?: string
  q?: string
}

export type RbacRolePolicyDTO = {
  id: string
  role_id: string
  scope_id: string
  metadata?: Record<string, unknown> | null
}

export type FilterableRbacRolePolicyProps = {
  id?: string | string[]
  role_id?: string | string[]
  scope_id?: string | string[]
}

export type RbacRoleInheritanceDTO = {
  id: string
  role_id: string
  inherited_role_id: string
  metadata?: Record<string, unknown> | null
}

export type FilterableRbacRoleInheritanceProps = {
  id?: string | string[]
  role_id?: string | string[]
  inherited_role_id?: string | string[]
}
