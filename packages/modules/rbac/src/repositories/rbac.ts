import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { Context } from "@medusajs/framework/types"
import { MikroOrmBase } from "@medusajs/framework/utils"

export class RbacRepository extends MikroOrmBase {
  constructor() {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
  }

  async listPoliciesForRole(
    roleId: string,
    sharedContext: Context = {}
  ): Promise<any[]> {
    const manager = this.getActiveManager<SqlEntityManager>(sharedContext)
    const knex = manager.getKnex()

    const query = `
      WITH RECURSIVE role_hierarchy AS (
        SELECT id, name
        FROM rbac_role
        WHERE id = ? AND deleted_at IS NULL
        
        UNION ALL
        
        -- get all inherited roles
        SELECT r.id, r.name
        FROM rbac_role r
        INNER JOIN rbac_role_inheritance ri ON ri.inherited_role_id = r.id
        INNER JOIN role_hierarchy rh ON rh.id = ri.role_id
        WHERE r.deleted_at IS NULL AND ri.deleted_at IS NULL
      )
      SELECT DISTINCT
        p.id,
        p.key,
        p.resource,
        p.operation,
        p.name,
        p.description,
        p.metadata,
        p.created_at,
        p.updated_at
      FROM rbac_policy p
      INNER JOIN rbac_role_policy rp ON rp.scope_id = p.id
      INNER JOIN role_hierarchy rh ON rh.id = rp.role_id
      WHERE p.deleted_at IS NULL AND rp.deleted_at IS NULL
      ORDER BY p.resource, p.operation, p.key
    `

    const result = await knex.raw(query, [roleId])

    return result.rows || []
  }
}
