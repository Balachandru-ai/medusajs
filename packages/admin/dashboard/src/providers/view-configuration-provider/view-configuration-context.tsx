import { createContext } from "react"
import { HttpTypes } from "@medusajs/types"

export type ViewConfiguration = HttpTypes.AdminViewConfiguration

type ViewConfigurationContextValue = {
  // Cached view configurations by entity
  viewConfigurations: Map<string, ViewConfiguration[]>
  // Active view configuration by entity
  activeViews: Map<string, ViewConfiguration>
  // Loading states
  isLoading: Map<string, boolean>
  // Track which entities have default active
  defaultActiveEntities: Set<string>
  // Metadata about active views
  activeViewMetadata: Map<string, { is_default_active: boolean; default_type?: "system" | "code" }>
  // Get view configurations for an entity (uses cache)
  getViewConfigurations: (entity: string) => Promise<ViewConfiguration[]>
  // Get active view configuration for an entity
  getActiveView: (entity: string) => Promise<ViewConfiguration | null>
  // Set active view configuration (null to clear/use default)
  setActiveView: (entity: string, viewConfigurationId: string | null) => Promise<void>
  // Create a new view configuration
  createViewConfiguration: (config: Omit<ViewConfiguration, "id" | "created_at" | "updated_at">) => Promise<ViewConfiguration>
  // Update a view configuration
  updateViewConfiguration: (id: string, config: Partial<ViewConfiguration>) => Promise<ViewConfiguration>
  // Delete a view configuration
  deleteViewConfiguration: (id: string) => Promise<void>
  // Invalidate cache for an entity
  invalidateCache: (entity: string) => void
}

export const ViewConfigurationContext = createContext<ViewConfigurationContextValue | null>(null)