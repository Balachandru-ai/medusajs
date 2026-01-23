import type { LinkDefinition } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export interface LinkUsersToRolesStepInput {
  user_id: string
  role_ids: string[]
}

export const linkUsersToRolesStepId = "link-users-to-roles-step"
/**
 * This step links users to RBAC roles using the remote link service.
 *
 * @example
 * const data = linkUsersToRolesStep({
 *   user_id: "user_123",
 *   role_ids: ["role_245asd156"]
 * })
 */
export const linkUsersToRolesStep = createStep(
  linkUsersToRolesStepId,
  async (input: LinkUsersToRolesStepInput[], { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    if (!input.length) {
      return new StepResponse([], [])
    }

    const links: LinkDefinition[] = []

    for (const { user_id, role_ids } of input) {
      for (const role_id of role_ids) {
        links.push({
          [Modules.USER]: {
            user_id,
          },
          [Modules.RBAC]: {
            rbac_role_id: role_id,
          },
        })
      }
    }

    const createdLinks = await link.create(links)
    return new StepResponse(createdLinks, links)
  },
  async (createdLinks, { container }) => {
    if (!createdLinks?.length) {
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    await link.dismiss(createdLinks)
  }
)
