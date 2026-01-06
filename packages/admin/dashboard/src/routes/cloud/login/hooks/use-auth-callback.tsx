import { toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { decodeToken } from "react-jwt"
import { useNavigate } from "react-router-dom"
import { CLOUD_AUTH_PROVIDER } from ".."
import { useCreateCloudAuthUser } from "../../../../hooks/api/cloud"
import { sdk } from "../../../../lib/client"

export const useCloudAuthCallback = (searchParams: URLSearchParams) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { mutateAsync: createCloudAuthUser } = useCreateCloudAuthUser()

  const { mutateAsync: handleCallback, isPending: isCallbackPending } =
    useMutation({
      mutationFn: async () => {
        let token: string
        try {
          const query = Object.fromEntries(searchParams)
          delete query.auth_provider // BE doesn't need this

          token = await sdk.auth.callback("user", CLOUD_AUTH_PROVIDER, query)
        } catch (error) {
          throw new Error("Authentication callback failed")
        }

        const decodedToken = decodeToken(token) as {
          actor_id: string
          user_metadata: Record<string, unknown>
        }

        // If user doesn't exist, create it
        if (!decodedToken?.actor_id) {
          await createCloudAuthUser()

          // Refresh token to get the updated token with actor_id
          const refreshedToken = await sdk.auth.refresh({
            Authorization: `Bearer ${token}`, // passing it manually in case the auth type is session
          })
          if (!refreshedToken) {
            throw new Error("Failed to refresh token after user creation")
          }
        }

        return true
      },
      onSuccess: () => {
        navigate("/")
      },
      onError: () => {
        toast.error(t("auth.login.authenticationFailed"))
      },
    })

  return { handleCallback, isCallbackPending }
}
