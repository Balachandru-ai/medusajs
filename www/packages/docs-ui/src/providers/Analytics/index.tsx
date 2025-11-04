"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useSegmentAnalytics } from "./providers/segment"
import { usePostHogAnalytics } from "./providers/posthog"
import { useReoDevAnalytics } from "./providers/reo-dev"

export type ExtraData = {
  section?: string
  [key: string]: unknown
}

export type AnalyticsContextType = {
  track: ({
    event,
    instant,
  }: {
    event: TrackedEvent
    instant?: boolean
  }) => void
}

type Trackers = "segment" | "posthog"

export type TrackedEvent = {
  event: string
  options?: Record<string, unknown>
  callback?: () => void
  tracker?: Trackers | Trackers[]
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export type AnalyticsProviderProps = {
  segmentWriteKey?: string
  reoDevKey?: string
  children?: React.ReactNode
}

export const AnalyticsProvider = ({
  segmentWriteKey,
  reoDevKey,
  children,
}: AnalyticsProviderProps) => {
  const [eventsQueue, setEventsQueue] = useState<TrackedEvent[]>([])
  const { track: trackWithSegment } = useSegmentAnalytics({
    segmentWriteKey,
    setEventsQueue,
  })
  const { track: trackWithPostHog } = usePostHogAnalytics()
  useReoDevAnalytics({ reoDevKey })

  const processEvent = useCallback(
    async (event: TrackedEvent) => {
      const trackers = Array.isArray(event.tracker)
        ? event.tracker
        : [event.tracker]
      await Promise.all(
        trackers.map(async (tracker) => {
          switch (tracker) {
            case "posthog":
              return trackWithPostHog(event)
            case "segment":
            default:
              return trackWithSegment(event)
          }
        })
      )
    },
    [trackWithSegment, trackWithPostHog]
  )

  const track = ({ event }: { event: TrackedEvent }) => {
    // Always queue events - this makes tracking non-blocking
    setEventsQueue((prevQueue) => [...prevQueue, event])

    // Process event callback immediately
    // This ensures that the callback is called even if the event is queued
    event.callback?.()
  }

  useEffect(() => {
    if (eventsQueue.length) {
      // Process queue in background without blocking
      const currentQueue = [...eventsQueue]
      setEventsQueue([])

      // Process events asynchronously in batches to avoid overwhelming the system
      const batchSize = 5
      for (let i = 0; i < currentQueue.length; i += batchSize) {
        const batch = currentQueue.slice(i, i + batchSize)
        setTimeout(() => {
          batch.forEach(processEvent)
        }, i * 10) // Small delay between batches
      }
    }
  }, [eventsQueue, processEvent])

  return (
    <AnalyticsContext.Provider
      value={{
        track,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)

  if (!context) {
    throw new Error("useAnalytics must be used within a AnalyticsProvider")
  }

  return context
}
