import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaErrorTypes,
} from "@medusajs/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "../types"

export async function setSecretApiKeyContext(
  req: AuthenticatedMedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) {
  if (!req.auth_context) {
    throw new MedusaError(
      MedusaErrorTypes.INVALID_DATA,
      "No `auth_context` found in request, make sure to apply this middleware after the `authenticate` middleware."
    )
  }

  const shouldSkip = req.auth_context.actor_type !== "api-key"
  if (shouldSkip) {
    return next()
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [apiKey],
  } = await query.graph(
    {
      entity: "api_key",
      fields: ["created_by"],
      filters: {
        id: req.auth_context.actor_id,
      },
      withDeleted: true,
    },
    {
      cache: {
        enable: true,
      },
    }
  )

  if (!apiKey) {
    throw new MedusaError(
      MedusaErrorTypes.NOT_FOUND,
      `API key with id ${req.auth_context.actor_id} not found`
    )
  }

  req.secret_key_context = {
    created_by: apiKey.created_by,
  }
  next()
}
