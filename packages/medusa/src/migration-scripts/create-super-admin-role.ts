#!/usr/bin/env node

/**
 * Migration Script: Assign Super Admin Role to All Admin Users
 *
 * This script assigns the pre-created super admin role (created by migration)
 * to all existing admin users in your Medusa instance.
 *
 * The super admin role and wildcard policy are created by the migration:
 * - Migration20260123115138_createSuperAdminRole
 *
 * Usage: npx tsx packages/medusa/src/migration-scripts/create-super-admin-role.ts
 */

import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import dotenv from "dotenv"

dotenv.config()

interface User {
  id: string
  email?: string
  [key: string]: any
}

async function assignSuperAdminRoleToUsers(container: any): Promise<void> {
  try {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info("🚀 Starting super admin role assignment script...")

    // Check environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required")
    }

    logger.info("Assigning super admin role to users")

    // Get required services
    const userModuleService = container.resolve(Modules.USER)
    const rbacModuleService = container.resolve(Modules.RBAC)

    // Fetch all admin users
    const users: User[] = await userModuleService.listUsers({
      // You can add filters here if needed, e.g., only users with specific metadata
    })

    if (users.length === 0) {
      logger.info("⚠️  No users found. Exiting.")
      return
    }

    logger.info(`📊 Found ${users.length} users`)

    // Display user information
    logger.info("\n👥 Users found:")
    users.forEach((user: User, index: number) => {
      logger.info(`  ${index + 1}. ${user.email || user.id} (${user.id})`)
    })

    logger.info("\n🔐 Looking for super admin role...")

    // Get the pre-created super admin role
    let superAdminRole: any
    try {
      const existingRoles = await rbacModuleService.listRbacRoles({
        id: "role_super_admin",
      })

      if (existingRoles.length > 0) {
        superAdminRole = existingRoles[0]
        logger.info(
          `✅ Found super admin role: ${superAdminRole.name} (${superAdminRole.id})`
        )
      } else {
        throw new Error(
          "Super admin role not found. Please ensure the migration Migration20260123115138_createSuperAdminRole has been run."
        )
      }
    } catch (error) {
      logger.error(
        "❌ Could not find super admin role. Please ensure the migration has been run:",
        error
      )
      throw error
    }

    // Verify the role has the wildcard policy
    try {
      const rolePolicies = await rbacModuleService.listRbacRolePolicies({
        role_id: superAdminRole.id,
      })

      if (rolePolicies.length === 0) {
        logger.warn(
          "⚠️  Super admin role has no policies assigned. This might indicate an issue with the migration."
        )
      } else {
        logger.info(
          `✅ Super admin role has ${rolePolicies.length} policies assigned`
        )
      }
    } catch (error) {
      logger.warn("⚠️  Could not verify role policies:", error)
    }

    logger.info("👥 Assigning super admin role to all users...")

    let successCount = 0
    let errorCount = 0
    let alreadyAssignedCount = 0

    // Get the remote link service
    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)

    // Assign the role to all existing users
    for (const user of users) {
      try {
        logger.info(`  🔄 Processing user: ${user.email || user.id}`)

        // Check if user already has the super admin role
        const existingLinks = await remoteLink.list({
          [Modules.USER]: {
            user_id: user.id,
          },
          [Modules.RBAC]: {
            rbac_role_id: superAdminRole.id,
          },
        })

        if (existingLinks.length > 0) {
          logger.info(`    ℹ️  User already has super admin role`)
          alreadyAssignedCount++
          continue
        }

        // Link the user to the super admin role using remoteLink
        await remoteLink.create({
          [Modules.USER]: {
            user_id: user.id,
          },
          [Modules.RBAC]: {
            rbac_role_id: superAdminRole.id,
          },
        })

        logger.info(`    ✅ Assigned super admin role to user`)
        successCount++
      } catch (error: any) {
        console.error(
          `    ❌ Failed to assign role to user ${user.id}:`,
          error.message
        )
        errorCount++
      }
    }

    logger.info(`\n📈 Summary:`)
    logger.info(`  ✅ Successfully assigned role: ${successCount} users`)
    logger.info(`  ℹ️  Already had role: ${alreadyAssignedCount} users`)
    logger.info(`  ❌ Failed to assign role: ${errorCount} users`)

    if (successCount > 0 || alreadyAssignedCount > 0) {
      logger.log("\n🎉 Super admin role assignment completed successfully!")

      const totalAssigned = successCount + alreadyAssignedCount
      logger.info(
        `Super admin role is now assigned to ${totalAssigned} out of ${users.length} users`
      )

      if (successCount > 0) {
        logger.info("\n📝 Next steps:")
        logger.info("  1. Restart your Medusa server")
        logger.info("  2. Test the permissions by logging in as an admin user")
        logger.info(
          "  3. Verify that the user has access to all admin endpoints"
        )
      }
    }
  } catch (error: any) {
    console.error("\n❌ Fatal error:", error.message)
    console.error("🔍 Stack trace:", error.stack)

    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info("\n🛠️  Troubleshooting tips:")
    logger.info("  • Ensure DATABASE_URL is set correctly")
    logger.info("  • Make sure all Medusa modules are installed")
    logger.info("  • Check that the database is accessible")
    logger.info(
      "  • Verify that migrations have been run (Migration20260123115138_createSuperAdminRole)"
    )

    throw error
  }
}

export default async function createSuperAdminRole({ container }: ExecArgs) {
  if (
    !MedusaModule.isInstalled(Modules.USER) ||
    !MedusaModule.isInstalled(Modules.AUTH) ||
    !MedusaModule.isInstalled(Modules.RBAC)
  ) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info(
      "⚠️  Required modules (USER, AUTH, RBAC) not installed. Skipping."
    )
    return
  }

  try {
    await assignSuperAdminRoleToUsers(container)
  } catch (error) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error("Failed to assign super admin role:", error)
    throw error
  }
}
