import { toast } from "@medusajs/ui"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { CLOUD_AUTH_PROVIDER } from "."
import { useCloudAuthCallback } from "./hooks/use-auth-callback"
import { useCloudLogin } from "./hooks/use-auth-login"

export const CloudLogin = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const { handleLogin } = useCloudLogin()
  const { handleCallback } = useCloudAuthCallback(searchParams)

  const callbackInitiated = useRef(false) // ref to prevent duplicate calls in React strict mode and other unmounting+mounting scenarios
  useEffect(() => {
    const isSuccessfulCallback =
      searchParams.get("auth_provider") === CLOUD_AUTH_PROVIDER &&
      searchParams.has("code") &&
      searchParams.has("state")
    const isErrorCallback =
      searchParams.get("auth_provider") === CLOUD_AUTH_PROVIDER &&
      searchParams.has("error")

    if (isSuccessfulCallback && !callbackInitiated.current) {
      callbackInitiated.current = true
      handleCallback()
    } else if (isErrorCallback) {
      toast.error(t("auth.login.authenticationFailed"))
    } else {
      handleLogin()
    }
  }, [searchParams, t, handleCallback, handleLogin])

  return <div className="bg-ui-bg-subtle min-h-dvh w-dvw" />
}
