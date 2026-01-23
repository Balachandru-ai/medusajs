import { ExclamationCircle } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation, useRouteError } from "react-router-dom"

import { isFetchError } from "../../../lib/is-fetch-error"

export const ErrorBoundary = () => {
  const error = useRouteError()
  const location = useLocation()
  const { t } = useTranslation()

  let code: number | null = null
  let errorMessage: string | null = null

  console.log("hit error boundary")
  console.error(error)

  if (isFetchError(error)) {
    if (error.status === 401) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    code = error.status ?? null
    // Extract the actual error message from the FetchError
    errorMessage = error.message || null
  } else if (error instanceof Error) {
    // For other Error types, use the error message
    errorMessage = error.message
  }

  /**
   * Log error in development mode.
   *
   * react-router-dom will sometimes swallow the error,
   * so this ensures that we always log it.
   */
  console.error(error)

  let title: string
  let message: string

  switch (code) {
    case 400:
      title = t("errorBoundary.badRequestTitle")
      message = errorMessage || t("errorBoundary.badRequestMessage")
      break
    case 404:
      title = t("errorBoundary.notFoundTitle")
      message = errorMessage || t("errorBoundary.notFoundMessage")
      break
    case 500:
      title = t("errorBoundary.internalServerErrorTitle")
      message = errorMessage || t("errorBoundary.internalServerErrorMessage")
      break
    default:
      title = t("errorBoundary.defaultTitle")
      message = errorMessage || t("errorBoundary.defaultMessage")
      break
  }

  // Serialize error for display in development
  const errorDetails =
    process.env.NODE_ENV === "development"
      ? JSON.stringify(
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : typeof error === "object" && error !== null
            ? error
            : String(error),
          null,
          2
        )
      : null

  return (
    <div className="flex size-full min-h-[calc(100vh-57px-24px)] items-center justify-center">
      <div className="flex flex-col gap-y-6">
        <div className="text-ui-fg-subtle flex flex-col items-center gap-y-3">
          <ExclamationCircle />
          <div className="flex flex-col items-center justify-center gap-y-1">
            <Text size="small" leading="compact" weight="plus">
              {title}
            </Text>
            <Text
              size="small"
              className="text-ui-fg-muted text-balance text-center"
            >
              {message}
            </Text>
            {errorDetails && (
              <details className="mt-4 max-w-md">
                <summary className="text-ui-fg-muted cursor-pointer text-xs">
                  Error details
                </summary>
                <pre className="bg-ui-bg-subtle mt-2 overflow-auto rounded p-2 text-xs">
                  {errorDetails}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
