import * as React from "react"

export type HookRegistryItem = {
  table: React.LazyExoticComponent<React.ComponentType>
}

export const HookRegistry: Record<string, HookRegistryItem> = {
  usePrompt: {
    table: React.lazy(async () => import("./hooks/usePrompt")),
  },
  useToggleState: {
    table: React.lazy(async () => import("./hooks/useToggleState")),
  },
}
