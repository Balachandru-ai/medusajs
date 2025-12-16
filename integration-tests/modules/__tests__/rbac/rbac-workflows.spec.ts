import {
  createRbacPoliciesWorkflow,
  createRbacRolesWorkflow,
} from "@medusajs/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IRbacModuleService, MedusaContainer } from "@medusajs/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/utils"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  env: {},
  testSuite: ({ getContainer }) => {
    describe("Workflows: RBAC", () => {
      let appContainer: MedusaContainer
      let rbacService: IRbacModuleService

      beforeAll(async () => {
        appContainer = getContainer()
        rbacService = appContainer.resolve(Modules.RBAC)
      })

      describe("Role Inheritance and Policy Management", () => {
        it("should create roles with inheritance and policies, then list all inherited policies", async () => {
          // Step 1: Create base policies
          const policiesWorkflow = createRbacPoliciesWorkflow(appContainer)
          const { result: createdPolicies } = await policiesWorkflow.run({
            input: {
              policies: [
                {
                  key: "read:products",
                  resource: "product",
                  operation: "read",
                  name: "Read Products",
                  description: "Permission to read products",
                },
                {
                  key: "write:products",
                  resource: "product",
                  operation: "write",
                  name: "Write Products",
                  description: "Permission to write products",
                },
                {
                  key: "read:orders",
                  resource: "order",
                  operation: "read",
                  name: "Read Orders",
                  description: "Permission to read orders",
                },
                {
                  key: "write:orders",
                  resource: "order",
                  operation: "write",
                  name: "Write Orders",
                  description: "Permission to write orders",
                },
                {
                  key: "delete:users",
                  resource: "user",
                  operation: "delete",
                  name: "Delete Users",
                  description: "Permission to delete users",
                },
              ],
            },
          })

          expect(createdPolicies).toHaveLength(5)

          // Step 2: Create base roles with their policies
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)

          // Create "Viewer" role with read permissions
          const { result: viewerRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Viewer",
                  description: "Can view products and orders",
                  policy_ids: [
                    createdPolicies[0].id, // read:products
                    createdPolicies[2].id, // read:orders
                  ],
                },
              ],
            },
          })

          expect(viewerRoles).toHaveLength(1)
          const viewerRole = viewerRoles[0]

          // Create "Editor" role with write permissions
          const { result: editorRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Editor",
                  description: "Can write products and orders",
                  policy_ids: [
                    createdPolicies[1].id, // write:products
                    createdPolicies[3].id, // write:orders
                  ],
                },
              ],
            },
          })

          expect(editorRoles).toHaveLength(1)
          const editorRole = editorRoles[0]

          // Step 3: Create "Admin" role that inherits from both Viewer and Editor, plus additional permissions
          const { result: adminRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Admin",
                  description:
                    "Inherits from Viewer and Editor, plus can delete users",
                  inherited_role_ids: [viewerRole.id, editorRole.id],
                  policy_ids: [
                    createdPolicies[4].id, // delete:users
                  ],
                },
              ],
            },
          })

          expect(adminRoles).toHaveLength(1)
          const adminRole = adminRoles[0]

          // Step 4: Verify role inheritance was created
          const inheritances = await rbacService.listRbacRoleInheritances({
            role_id: adminRole.id,
          })

          expect(inheritances).toHaveLength(2)
          expect(inheritances).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                role_id: adminRole.id,
                inherited_role_id: viewerRole.id,
              }),
              expect.objectContaining({
                role_id: adminRole.id,
                inherited_role_id: editorRole.id,
              }),
            ])
          )

          // Step 5: Verify direct policies for Admin role
          const adminDirectPolicies = await rbacService.listRbacRolePolicies({
            role_id: adminRole.id,
          })

          expect(adminDirectPolicies).toHaveLength(1)
          expect(adminDirectPolicies[0]).toEqual(
            expect.objectContaining({
              role_id: adminRole.id,
              scope_id: createdPolicies[4].id, // delete:users
            })
          )

          // Step 6: List ALL policies for Admin role (including inherited)
          const allAdminPolicies = await rbacService.listPoliciesForRole(
            adminRole.id
          )

          // Admin should have:
          // - read:products (from Viewer)
          // - read:orders (from Viewer)
          // - write:products (from Editor)
          // - write:orders (from Editor)
          // - delete:users (direct)
          expect(allAdminPolicies).toHaveLength(5)

          const policyKeys = allAdminPolicies.map((p) => p.key).sort()
          expect(policyKeys).toEqual([
            "delete:users",
            "read:orders",
            "read:products",
            "write:orders",
            "write:products",
          ])

          // Verify each policy has correct details
          expect(allAdminPolicies).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                key: "read:products",
                resource: "product",
                operation: "read",
              }),
              expect.objectContaining({
                key: "write:products",
                resource: "product",
                operation: "write",
              }),
              expect.objectContaining({
                key: "read:orders",
                resource: "order",
                operation: "read",
              }),
              expect.objectContaining({
                key: "write:orders",
                resource: "order",
                operation: "write",
              }),
              expect.objectContaining({
                key: "delete:users",
                resource: "user",
                operation: "delete",
              }),
            ])
          )

          // Step 7: Verify Viewer role only has its direct policies
          const viewerPolicies = await rbacService.listPoliciesForRole(
            viewerRole.id
          )

          expect(viewerPolicies).toHaveLength(2)
          expect(viewerPolicies).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                key: "read:products",
              }),
              expect.objectContaining({
                key: "read:orders",
              }),
            ])
          )

          // Step 8: Verify Editor role only has its direct policies
          const editorPolicies = await rbacService.listPoliciesForRole(
            editorRole.id
          )

          expect(editorPolicies).toHaveLength(2)
          expect(editorPolicies).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                key: "write:products",
              }),
              expect.objectContaining({
                key: "write:orders",
              }),
            ])
          )
        })

        it("should handle multi-level role inheritance", async () => {
          // Create policies
          const policiesWorkflow = createRbacPoliciesWorkflow(appContainer)
          const { result: policies } = await policiesWorkflow.run({
            input: {
              policies: [
                {
                  key: "read:catalog",
                  resource: "catalog",
                  operation: "read",
                  name: "Read Catalog",
                },
                {
                  key: "write:catalog",
                  resource: "catalog",
                  operation: "write",
                  name: "Write Catalog",
                },
                {
                  key: "admin:system",
                  resource: "system",
                  operation: "admin",
                  name: "System Admin",
                },
              ],
            },
          })

          // Create role hierarchy: Basic -> Manager -> SuperAdmin
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)

          // Level 1: Basic role
          const { result: basicRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Basic User",
                  description: "Basic read access",
                  policy_ids: [policies[0].id], // read:catalog
                },
              ],
            },
          })
          const basicRole = basicRoles[0]

          // Level 2: Manager inherits from Basic
          const { result: managerRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Manager",
                  description: "Manager with write access",
                  inherited_role_ids: [basicRole.id],
                  policy_ids: [policies[1].id], // write:catalog
                },
              ],
            },
          })
          const managerRole = managerRoles[0]

          // Level 3: SuperAdmin inherits from Manager
          const { result: superAdminRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "SuperAdmin",
                  description: "Super admin with all access",
                  inherited_role_ids: [managerRole.id],
                  policy_ids: [policies[2].id], // admin:system
                },
              ],
            },
          })
          const superAdminRole = superAdminRoles[0]

          // Verify SuperAdmin has all policies through inheritance chain
          const superAdminPolicies = await rbacService.listPoliciesForRole(
            superAdminRole.id
          )

          expect(superAdminPolicies).toHaveLength(3)
          expect(superAdminPolicies.map((p) => p.key).sort()).toEqual([
            "admin:system",
            "read:catalog",
            "write:catalog",
          ])

          // Verify Manager has policies from Basic + its own
          const managerPolicies = await rbacService.listPoliciesForRole(
            managerRole.id
          )

          expect(managerPolicies).toHaveLength(2)
          expect(managerPolicies.map((p) => p.key).sort()).toEqual([
            "read:catalog",
            "write:catalog",
          ])

          // Verify Basic only has its own policy
          const basicPolicies = await rbacService.listPoliciesForRole(
            basicRole.id
          )

          expect(basicPolicies).toHaveLength(1)
          expect(basicPolicies[0].key).toBe("read:catalog")
        })

        it("should propagate policy deletion from inherited role", async () => {
          // Create policies
          const policiesWorkflow = createRbacPoliciesWorkflow(appContainer)
          const { result: policies } = await policiesWorkflow.run({
            input: {
              policies: [
                {
                  key: "read:inventory",
                  resource: "inventory",
                  operation: "read",
                  name: "Read Inventory",
                },
                {
                  key: "write:inventory",
                  resource: "inventory",
                  operation: "write",
                  name: "Write Inventory",
                },
                {
                  key: "admin:inventory",
                  resource: "inventory",
                  operation: "admin",
                  name: "Admin Inventory",
                },
              ],
            },
          })

          // Create role hierarchy: Basic -> Manager -> SuperAdmin
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)

          // Level 1: Basic role with read permission
          const { result: basicRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Basic Inventory User",
                  description: "Basic inventory read access",
                  policy_ids: [policies[0].id], // read:inventory
                },
              ],
            },
          })
          const basicRole = basicRoles[0]

          // Level 2: Manager inherits from Basic + write permission
          const { result: managerRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Inventory Manager",
                  description: "Manager with write access",
                  inherited_role_ids: [basicRole.id],
                  policy_ids: [policies[1].id], // write:inventory
                },
              ],
            },
          })
          const managerRole = managerRoles[0]

          // Level 3: SuperAdmin inherits from Manager + admin permission
          const { result: superAdminRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Inventory SuperAdmin",
                  description: "Super admin with all access",
                  inherited_role_ids: [managerRole.id],
                  policy_ids: [policies[2].id], // admin:inventory
                },
              ],
            },
          })
          const superAdminRole = superAdminRoles[0]

          // Verify initial state: SuperAdmin has all 3 policies
          let superAdminPolicies = await rbacService.listPoliciesForRole(
            superAdminRole.id
          )
          expect(superAdminPolicies).toHaveLength(3)
          expect(superAdminPolicies.map((p) => p.key).sort()).toEqual([
            "admin:inventory",
            "read:inventory",
            "write:inventory",
          ])

          // Verify Manager has 2 policies (Basic's + its own)
          let managerPolicies = await rbacService.listPoliciesForRole(
            managerRole.id
          )
          expect(managerPolicies).toHaveLength(2)
          expect(managerPolicies.map((p) => p.key).sort()).toEqual([
            "read:inventory",
            "write:inventory",
          ])

          // Delete the read:inventory policy from Basic role
          const basicRolePolicies = await rbacService.listRbacRolePolicies({
            role_id: basicRole.id,
          })
          const readPolicyAssociation = basicRolePolicies.find(
            (rp) => rp.scope_id === policies[0].id
          )
          await rbacService.deleteRbacRolePolicies([readPolicyAssociation!.id])

          // Verify Basic role no longer has the read policy
          const basicPoliciesAfterDelete =
            await rbacService.listPoliciesForRole(basicRole.id)
          expect(basicPoliciesAfterDelete).toHaveLength(0)

          // Verify Manager role no longer inherits the read policy
          managerPolicies = await rbacService.listPoliciesForRole(
            managerRole.id
          )
          expect(managerPolicies).toHaveLength(1)
          expect(managerPolicies[0].key).toBe("write:inventory")

          // Verify SuperAdmin role also lost the read policy through inheritance chain
          superAdminPolicies = await rbacService.listPoliciesForRole(
            superAdminRole.id
          )
          expect(superAdminPolicies).toHaveLength(2)
          expect(superAdminPolicies.map((p) => p.key).sort()).toEqual([
            "admin:inventory",
            "write:inventory",
          ])
        })

        it("should handle role with no inherited roles or policies", async () => {
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)

          const { result: emptyRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Empty Role",
                  description: "Role with no permissions",
                },
              ],
            },
          })

          const emptyRole = emptyRoles[0]

          // Verify no policies
          const policies = await rbacService.listPoliciesForRole(emptyRole.id)
          expect(policies).toHaveLength(0)

          // Verify no inheritance
          const inheritances = await rbacService.listRbacRoleInheritances({
            role_id: emptyRole.id,
          })
          expect(inheritances).toHaveLength(0)
        })
      })

      describe("Permission Validation", () => {
        it("should prevent user without roles from creating roles with policies", async () => {
          const userModule = appContainer.resolve(Modules.USER)

          // Create a user with no roles
          const [user] = await userModule.createUsers([
            {
              email: "noroles@test.com",
              first_name: "No",
              last_name: "Roles",
            },
          ])

          // Create a policy
          const policiesWorkflow = createRbacPoliciesWorkflow(appContainer)
          const { result: policies } = await policiesWorkflow.run({
            input: {
              policies: [
                {
                  key: "read:test",
                  resource: "test",
                  operation: "read",
                  name: "Read Test",
                },
              ],
            },
          })

          // Try to create a role with this policy as a user with no roles
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)

          let error: any
          try {
            await rolesWorkflow.run({
              input: {
                user_id: user.id,
                roles: [
                  {
                    name: "Test Role",
                    policy_ids: [policies[0].id],
                  },
                ],
              },
            })
          } catch (e) {
            error = e
          }

          expect(error).toBeDefined()
          expect(error.message).toContain(
            "User does not have any roles assigned and cannot create roles or assign policies"
          )
        })

        it("should prevent user from assigning policies they don't have access to", async () => {
          const userModule = appContainer.resolve(Modules.USER)
          const remoteLink = appContainer.resolve(
            ContainerRegistrationKeys.LINK
          )

          // Create policies
          const policiesWorkflow = createRbacPoliciesWorkflow(appContainer)
          const { result: policies } = await policiesWorkflow.run({
            input: {
              policies: [
                {
                  key: "read:products",
                  resource: "product",
                  operation: "read",
                  name: "Read Products",
                },
                {
                  key: "write:products",
                  resource: "product",
                  operation: "write",
                  name: "Write Products",
                },
                {
                  key: "delete:products",
                  resource: "product",
                  operation: "delete",
                  name: "Delete Products",
                },
              ],
            },
          })

          // Create a role with only read permission
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)
          const { result: limitedRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Limited Role",
                  policy_ids: [policies[0].id], // Only read:products
                },
              ],
            },
          })

          // Create a user and assign the limited role
          const [user] = await userModule.createUsers([
            {
              email: "limited@test.com",
              first_name: "Limited",
              last_name: "User",
            },
          ])

          await remoteLink.create({
            [Modules.USER]: {
              user_id: user.id,
            },
            [Modules.RBAC]: {
              rbac_role_id: limitedRoles[0].id,
            },
          })

          // Try to create a role with write permission
          let error: any
          try {
            await rolesWorkflow.run({
              input: {
                user_id: user.id,
                roles: [
                  {
                    name: "New Role",
                    policy_ids: [policies[1].id], // write:products - user doesn't have this
                  },
                ],
              },
            })
          } catch (e) {
            error = e
          }

          expect(error).toBeDefined()
          expect(error.message).toContain(
            "User does not have access to the following policies and cannot assign them"
          )
        })

        it("should allow user to create roles with policies they have access to", async () => {
          const userModule = appContainer.resolve(Modules.USER)
          const remoteLink = appContainer.resolve(
            ContainerRegistrationKeys.LINK
          )

          // Create policies
          const policiesWorkflow = createRbacPoliciesWorkflow(appContainer)
          const { result: policies } = await policiesWorkflow.run({
            input: {
              policies: [
                {
                  key: "read:orders",
                  resource: "order",
                  operation: "read",
                  name: "Read Orders",
                },
                {
                  key: "write:orders",
                  resource: "order",
                  operation: "write",
                  name: "Write Orders",
                },
              ],
            },
          })

          // Create an admin role with both permissions
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)
          const { result: adminRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Order Admin",
                  policy_ids: [policies[0].id, policies[1].id],
                },
              ],
            },
          })

          // Create a user and assign the admin role
          const [user] = await userModule.createUsers([
            {
              email: "admin@test.com",
              first_name: "Admin",
              last_name: "User",
            },
          ])

          await remoteLink.create({
            [Modules.USER]: {
              user_id: user.id,
            },
            [Modules.RBAC]: {
              rbac_role_id: adminRoles[0].id,
            },
          })

          // User should be able to create a role with read permission (which they have)
          const { result: newRoles } = await rolesWorkflow.run({
            input: {
              user_id: user.id,
              roles: [
                {
                  name: "Order Viewer",
                  policy_ids: [policies[0].id], // read:orders - user has this
                },
              ],
            },
          })

          expect(newRoles).toHaveLength(1)
          expect(newRoles[0].name).toBe("Order Viewer")

          // Verify the role was created with the correct policy
          const newRolePolicies = await rbacService.listPoliciesForRole(
            newRoles[0].id
          )
          expect(newRolePolicies).toHaveLength(1)
          expect(newRolePolicies[0].key).toBe("read:orders")
        })

        it("should allow user with inherited permissions to create roles", async () => {
          const userModule = appContainer.resolve(Modules.USER)
          const remoteLink = appContainer.resolve(
            ContainerRegistrationKeys.LINK
          )

          // Create policies
          const policiesWorkflow = createRbacPoliciesWorkflow(appContainer)
          const { result: policies } = await policiesWorkflow.run({
            input: {
              policies: [
                {
                  key: "read:inventory",
                  resource: "inventory",
                  operation: "read",
                  name: "Read Inventory",
                },
                {
                  key: "write:inventory",
                  resource: "inventory",
                  operation: "write",
                  name: "Write Inventory",
                },
              ],
            },
          })

          // Create base role with read permission
          const rolesWorkflow = createRbacRolesWorkflow(appContainer)
          const { result: baseRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Inventory Reader",
                  policy_ids: [policies[0].id],
                },
              ],
            },
          })

          // Create manager role that inherits from base + write permission
          const { result: managerRoles } = await rolesWorkflow.run({
            input: {
              roles: [
                {
                  name: "Inventory Manager",
                  inherited_role_ids: [baseRoles[0].id],
                  policy_ids: [policies[1].id],
                },
              ],
            },
          })

          // Create a user and assign the manager role
          const [user] = await userModule.createUsers([
            {
              email: "manager@test.com",
              first_name: "Manager",
              last_name: "User",
            },
          ])

          await remoteLink.create({
            [Modules.USER]: {
              user_id: user.id,
            },
            [Modules.RBAC]: {
              rbac_role_id: managerRoles[0].id,
            },
          })

          // User should be able to create a role with read permission (inherited)
          const { result: newRoles } = await rolesWorkflow.run({
            input: {
              user_id: user.id,
              roles: [
                {
                  name: "New Reader",
                  policy_ids: [policies[0].id], // read - user has via inheritance
                },
              ],
            },
          })

          expect(newRoles).toHaveLength(1)
          expect(newRoles[0].name).toBe("New Reader")
        })
      })
    })
  },
})
