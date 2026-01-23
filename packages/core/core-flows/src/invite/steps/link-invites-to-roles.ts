import type { LinkDefinition } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export interface LinkInvitesToRolesStepInput {
  invite_id: string
  role_ids: string[]
}

export const linkInvitesToRolesStepId = "link-invites-to-roles-step"
/**
 * This step links invites to RBAC roles using the remote link service.
 *
 * @example
 * const data = linkInvitesToRolesStep({
 *   invite_id: "invite_123",
 *   role_ids: ["role_245asd156"]
 * })
 */
export const linkInvitesToRolesStep = createStep(
  linkInvitesToRolesStepId,
  async (input: LinkInvitesToRolesStepInput[], { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    if (!input.length) {
      return new StepResponse([], [])
    }

    const links: LinkDefinition[] = []

    for (const { invite_id, role_ids } of input) {
      for (const role_id of role_ids) {
        links.push({
          [Modules.USER]: {
            invite_id,
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
