import { z } from "zod"

export const AdminAddRolePoliciesType = z.object({
  policies: z.array(z.string()).min(1, "At least one policy ID is required"),
})

export type AdminAddRolePoliciesType = z.infer<typeof AdminAddRolePoliciesType>
