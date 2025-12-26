import { Button, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { decodeToken } from "react-jwt"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useCreateCloudAuthUser } from "../../../hooks/api/cloud"
import { sdk } from "../../../lib/client"

const CLOUD_AUTH_PROVIDER = "cloud"

export const CloudAuthLogin = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mutateAsync: createCloudAuthUser } = useCreateCloudAuthUser()

  const { mutateAsync: handleCallback, isPending } = useMutation({
    mutationFn: async () => {
      let token: string
      try {
        token = await sdk.auth.callback(
          "user",
          CLOUD_AUTH_PROVIDER,
          Object.fromEntries(searchParams)
        )
      } catch (error) {
        throw new Error("Authentication failed")
      }

      const decodedToken = decodeToken(token) as {
        actor_id: string
        user_metadata: Record<string, unknown>
      }

      const userExists = decodedToken?.actor_id !== ""
      if (!userExists) {
        // Create user account for this auth identity
        await createCloudAuthUser({
          email: decodedToken.user_metadata.email as string,
          first_name: decodedToken.user_metadata.given_name as any,
          last_name: decodedToken.user_metadata.family_name as any,
        })

        // Refresh token to get the updated token with actor_id
        const newToken = await sdk.auth.refresh()
        if (!newToken) {
          throw new Error("Failed to refresh token after user creation")
        }
      }

      return true
    },
    onSuccess: () => {
      navigate("/app")
    },
    onError: (error) => {
      toast.error(error.message || "Authentication failed")
    },
  })

  // Check if we're returning from the OAuth callback
  const hasCallbackParams = useMemo(() => {
    return searchParams.has("code") && searchParams.has("state")
  }, [searchParams])

  useEffect(() => {
    if (hasCallbackParams) {
      handleCallback()
    }
  }, [hasCallbackParams, handleCallback])

  // Handle login button click
  const handleCloudLogin = async () => {
    try {
      const result = await sdk.auth.login("user", CLOUD_AUTH_PROVIDER, {})

      if (typeof result === "object" && result.location) {
        // Redirect to Medusa Cloud for authentication
        window.location.href = result.location
        return
      }

      if (typeof result !== "string") {
        toast.error("Authentication failed")
        return
      }
    } catch {
      toast.error("Failed to initiate authentication")
    }
  }

  return (
    <>
      <hr className="bg-ui-border-base my-4" />
      <Button
        variant="secondary"
        onClick={handleCloudLogin}
        className="w-full"
        disabled={isPending}
        isLoading={isPending}
      >
        Login with Medusa Cloud
      </Button>
    </>
  )
}
