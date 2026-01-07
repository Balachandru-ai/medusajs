import { EventOptions } from "@medusajs/types"
import { buildEventNamesFromEntityName } from "../event-bus"
import { Modules } from "../modules-sdk"

const eventBaseNames: ["user", "invite"] = ["user", "invite"]

export const UserEvents = {
  ...buildEventNamesFromEntityName(eventBaseNames, Modules.USER),
  INVITE_TOKEN_GENERATED: `${Modules.USER}.user.invite.token_generated`,
} as const

type UserEventValues = (typeof UserEvents)[keyof typeof UserEvents]

declare module "@medusajs/types" {
  export interface EventBusEventsOptions
    extends Record<UserEventValues, EventOptions | undefined> {}
}
