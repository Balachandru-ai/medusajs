import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { CLOUD_AUTH_PROVIDER } from "."
import { useCloudAuthCallback } from "./hooks/use-auth-callback"
import { useCloudLogin } from "./hooks/use-auth-login"

export const CloudLogin = () => {
  const [searchParams] = useSearchParams()

  const { handleLogin } = useCloudLogin()
  const { handleCallback } = useCloudAuthCallback(searchParams)

  // Check if we're returning from the OAuth callback
  const hasCallbackParams =
    searchParams.get("auth_provider") === CLOUD_AUTH_PROVIDER &&
    searchParams.has("code") &&
    searchParams.has("state")

  const callbackInitiated = useRef(false) // ref to prevent duplicate calls in React strict mode and other unmounting+mounting scenarios
  useEffect(() => {
    if (!hasCallbackParams) {
      handleLogin()
    } else if (!callbackInitiated.current) {
      callbackInitiated.current = true
      handleCallback()
    }
  }, [hasCallbackParams, handleCallback, handleLogin])

  return <div className="bg-ui-bg-subtle min-h-dvh w-dvw" />
}
