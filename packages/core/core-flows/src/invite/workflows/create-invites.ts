import type { InviteDTO, InviteWorkflow } from "@medusajs/framework/types"
import { InviteWorkflowEvents } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { createInviteStep, linkInvitesToRolesStep } from "../steps"
export const createInvitesWorkflowId = "create-invite-step"
/**
 * This workflow creates one or more user invites. It's used by the
 * [Create Invite Admin API Route](https://docs.medusajs.com/api/admin#invites_postinvites).
 *
 * You can provide roles to be assigned to each user when the invite is accepted.
 *
 * You can use this workflow within your customizations or your own custom workflows, allowing you to
 * create invites within your custom flows.
 *
 * @example
 * const { result } = await createInvitesWorkflow(container)
 * .run({
 *   input: {
 *     invites: [
 *       {
 *         email: "example@gmail.com",
 *         roles: ["role_super_admin"]
 *       }
 *     ]
 *   }
 * })
 *
 * @summary
 *
 * Create one or more user invites with optional role assignment.
 */
export const createInvitesWorkflow = createWorkflow(
  createInvitesWorkflowId,
  (
    input: WorkflowData<InviteWorkflow.CreateInvitesWorkflowInputDTO>
  ): WorkflowResponse<InviteDTO[]> => {
    const createdInvites = createInviteStep(input.invites)

    const invitesWithRoles = transform(
      { input, createdInvites },
      ({ input, createdInvites }) => {
        return input.invites
          .map((invite, index) => ({
            invite_id: createdInvites[index].id,
            role_ids: invite.roles || [],
          }))
          .filter(({ role_ids }) => role_ids.length > 0)
      }
    )

    linkInvitesToRolesStep(invitesWithRoles)

    const invitesIdEvents = transform(
      { createdInvites },
      ({ createdInvites }) => {
        return createdInvites.map((v) => {
          return { id: v.id }
        })
      }
    )

    emitEventStep({
      eventName: InviteWorkflowEvents.CREATED,
      data: invitesIdEvents,
    })

    return new WorkflowResponse(createdInvites)
  }
)
