import {
  createUserAccountWorkflow,
  setAuthAppMetadataWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import z from "zod"

export const CreateCloudAuthUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

type CreateCloudAuthUserBody = z.infer<typeof CreateCloudAuthUserSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateCloudAuthUserBody>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

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

  const user = await query
    .graph({
      entity: "user",
      fields: ["id"],
      filters: {
        email: req.validatedBody.email,
      },
    })
    .then((result) => result.data[0])

  if (user) {
    await setAuthAppMetadataWorkflow(req.scope).run({
      input: {
        authIdentityId: req.auth_context.auth_identity_id,
        actorType: "user",
        value: user.id,
      },
    })

    const updatedUser = await query
      .graph({
        entity: "user",
        fields: ["*"],
        filters: {
          id: user.id,
        },
      })
      .then((result) => result.data[0])

    res.status(200).json({ user: updatedUser })
    return
  }

  const { result: createdUser } = await createUserAccountWorkflow(
    req.scope
  ).run({
    input: {
      authIdentityId: req.auth_context.auth_identity_id,
      userData: {
        email: req.validatedBody.email,
        first_name: req.validatedBody.first_name,
        last_name: req.validatedBody.last_name,
      },
    },
  })

  res.status(201).json({ user: createdUser })
}
