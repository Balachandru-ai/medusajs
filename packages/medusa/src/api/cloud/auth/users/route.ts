import { createUserAccountWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import z from "zod"

export const CreateCloudAuthUserSchema = z.object({
  email: z.string().email(),
})

type CreateCloudAuthUserBody = z.infer<typeof CreateCloudAuthUserSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateCloudAuthUserBody>,
  res: MedusaResponse
) => {
  // If user already exists for this auth identity, reject
  if (req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "The user is already registered and cannot create a new account."
    )
  }

  if (!req.auth_context?.auth_identity_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required to create a user account."
    )
  }

  const { result: user } = await createUserAccountWorkflow(req.scope).run({
    input: {
      authIdentityId: req.auth_context.auth_identity_id,
      userData: {
        email: req.body.email,
      },
    },
  })

  res.status(201).json({ user })
}
