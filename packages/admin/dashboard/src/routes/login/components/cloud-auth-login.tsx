import { Button } from "@medusajs/ui"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { CLOUD_AUTH_PROVIDER } from "../../cloud/login"
import { useCloudAuthCallback } from "../../cloud/login/hooks/use-auth-callback"
import { useCloudLogin } from "../../cloud/login/hooks/use-auth-login"

export const CloudAuthLogin = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const { handleCallback, isCallbackPending } =
    useCloudAuthCallback(searchParams)

  // Check if we're returning from the OAuth callback
  const hasCallbackParams =
    searchParams.get("auth_provider") === CLOUD_AUTH_PROVIDER &&
    searchParams.has("code") &&
    searchParams.has("state")

  const callbackInitiated = useRef(false) // ref to prevent duplicate calls in React strict mode and other unmounting+mounting scenarios
  useEffect(() => {
    if (hasCallbackParams && !callbackInitiated.current) {
      callbackInitiated.current = true
      handleCallback()
    }
  }, [hasCallbackParams, handleCallback])

  const { handleLogin } = useCloudLogin()

  return (
    <>
      <hr className="bg-ui-border-base my-4" />
      <Button
        variant="secondary"
        onClick={handleLogin}
        className="w-full"
        disabled={isCallbackPending}
        isLoading={isCallbackPending}
      >
        {t("auth.login.cloud")}
      </Button>
    </>
  )
}
