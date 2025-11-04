"use client"

import React, { createContext, useCallback, useContext, useEffect } from "react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "@posthog/react"

export type ExtraData = {
  section?: string
  [key: string]: any
}

export type AnalyticsContextType = {
  track: (
    event: string,
    options?: Record<string, any>,
    callback?: () => void
  ) => void
}

export type TrackedEvent = {
  event: string
  options?: Record<string, any>
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export type AnalyticsProviderProps = {
  posthogApiKey?: string
  posthogHost?: string
  children?: React.ReactNode
}

export const AnalyticsProvider = ({
  posthogApiKey,
  posthogHost,
  children,
}: AnalyticsProviderProps) => {
  const track = useCallback(
    async (
      event: string,
      options?: Record<string, any>,
      callback?: () => void
    ) => {
      posthog.capture(event, options)
      callback?.()
    },
    []
  )

  useEffect(() => {
    if (!posthogApiKey || !posthogHost) {
      return
    }
    posthog.init(posthogApiKey, {
      api_host: posthogHost,
      defaults: "2025-05-24",
    })
  }, [posthogApiKey, posthogHost])

  return (
    <PHProvider client={posthog}>
      <AnalyticsContext.Provider
        value={{
          track,
        }}
      >
        {children}
      </AnalyticsContext.Provider>
    </PHProvider>
  )
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)

  if (!context) {
    throw new Error("useAnalytics must be used within a AnalyticsProvider")
  }

  return context
}
