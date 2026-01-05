import { z } from "zod"

export const ResetPasswordRequest = z.object({
  identifier: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})
export type ResetPasswordRequestType = z.infer<typeof ResetPasswordRequest>
