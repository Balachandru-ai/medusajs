import { toast } from "@medusajs/ui"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { CLOUD_AUTH_PROVIDER } from ".."
import { sdk } from "../../../../lib/client"

export const useCloudLogin = () => {
  const { t } = useTranslation()

  const handleLogin = useCallback(async () => {
    try {
      const result = await sdk.auth.login("user", CLOUD_AUTH_PROVIDER, {
        // in case the admin is on a different domain, or the backend URL is set to just "/" which won't work for the callback
        callback_url: `${window.location.origin}${window.location.pathname}?auth_provider=${CLOUD_AUTH_PROVIDER}`,
      })

      if (typeof result === "object" && result.location) {
        // Redirect to Medusa Cloud for authentication
        window.location.href = result.location
        return
      }

      throw new Error("Unexpected login response")
    } catch {
      toast.error(t("auth.login.authenticationFailed"))
    }
  }, [t])

  return { handleLogin }
}
