import { PropsWithChildren, useCallback, useRef, useState } from "react"
import { ViewConfigurationContext, ViewConfiguration } from "./view-configuration-context"
import { sdk } from "../../lib/client"
import { toast } from "@medusajs/ui"
import { useFeatureFlag } from "../feature-flag-provider"

export const ViewConfigurationProvider = ({ children }: PropsWithChildren) => {
  const [viewConfigurations] = useState<Map<string, ViewConfiguration[]>>(new Map())
  const [activeViews] = useState<Map<string, ViewConfiguration>>(new Map())
  const [isLoading] = useState<Map<string, boolean>>(new Map())
  const [defaultActiveEntities] = useState<Set<string>>(new Set()) // Track which entities have default active
  const [activeViewMetadata] = useState<Map<string, { is_default_active: boolean; default_type?: "system" | "code" }>>(new Map())
  const isViewConfigEnabled = useFeatureFlag("view_configurations")
  
  // Force re-render when maps change
  const [, forceUpdate] = useState({})
  
  // Use ref to track ongoing requests to prevent duplicate fetches
  const fetchingRef = useRef<Map<string, Promise<ViewConfiguration[]>>>(new Map())

  const getViewConfigurations = useCallback(async (entity: string): Promise<ViewConfiguration[]> => {
    // Return empty array if feature is disabled
    if (!isViewConfigEnabled) {
      return []
    }
    
    // Check cache first
    if (viewConfigurations.has(entity)) {
      return viewConfigurations.get(entity)!
    }

    // Check if we're already fetching
    if (fetchingRef.current.has(entity)) {
      return fetchingRef.current.get(entity)!
    }

    // Start loading
    isLoading.set(entity, true)

    // Create fetch promise
    const fetchPromise = sdk.admin.views.listConfigurations(entity, { 
      limit: 100 
    }).then(response => {
      const configs = response.view_configurations
      viewConfigurations.set(entity, configs)
      isLoading.set(entity, false)
      fetchingRef.current.delete(entity)
      return configs
    }).catch(error => {
      isLoading.set(entity, false)
      fetchingRef.current.delete(entity)
      return []
    })

    fetchingRef.current.set(entity, fetchPromise)
    return fetchPromise
  }, [viewConfigurations, isLoading, isViewConfigEnabled])

  const getActiveView = useCallback(async (entity: string): Promise<ViewConfiguration | null> => {
    // Return null if feature is disabled
    if (!isViewConfigEnabled) {
      return null
    }
    
    // Check cache first - but we need to also check metadata
    const cachedMetadata = activeViewMetadata.get(entity)
    if (cachedMetadata && activeViews.has(entity)) {
      return activeViews.get(entity)
    } else if (cachedMetadata && cachedMetadata.is_default_active && cachedMetadata.default_type === "code") {
      // Code default is active, return null
      return null
    }

    try {
      const response = await sdk.admin.views.retrieveActiveConfiguration(entity)
      const { view_configuration, is_default_active, default_type } = response
      
      // Store metadata
      activeViewMetadata.set(entity, { is_default_active: is_default_active || false, default_type })
      
      if (is_default_active && view_configuration) {
        // System default is active - store it in activeViews
        activeViews.set(entity, view_configuration)
        defaultActiveEntities.add(entity)
        forceUpdate({})
        return view_configuration
      } else if (is_default_active && !view_configuration) {
        // Code default is active - no view to store
        defaultActiveEntities.add(entity)
        forceUpdate({})
        return null
      } else if (view_configuration) {
        // Specific view is active
        activeViews.set(entity, view_configuration)
        defaultActiveEntities.delete(entity)
        forceUpdate({})
        return view_configuration
      }
      
      return null
    } catch (error) {
      return null
    }
  }, [activeViews, activeViewMetadata, defaultActiveEntities, isViewConfigEnabled])

  const setActiveView = useCallback(async (entity: string, viewConfigurationId: string | null) => {
    // Do nothing if feature is disabled
    if (!isViewConfigEnabled) {
      return
    }
    
    try {
      if (viewConfigurationId === null) {
        // Clear the active view by passing null
        await sdk.admin.views.setActiveConfiguration(entity, {
          view_configuration_id: null
        })
        
        // Clear the cache completely so getActiveView will fetch fresh data
        activeViews.delete(entity)
        activeViewMetadata.delete(entity)
        defaultActiveEntities.delete(entity)
        
        forceUpdate({})
      } else {
        await sdk.admin.views.setActiveConfiguration(entity, {
          view_configuration_id: viewConfigurationId
        })
        
        // Update cache
        const configs = await getViewConfigurations(entity)
        const activeConfig = configs.find(c => c.id === viewConfigurationId)
        if (activeConfig) {
          activeViews.set(entity, activeConfig)
          defaultActiveEntities.delete(entity)
          // Set metadata to indicate specific view is active
          activeViewMetadata.set(entity, { is_default_active: false })
          forceUpdate({})
        }
      }
    } catch (error) {
      toast.error("Failed to set active view")
    }
  }, [activeViews, getViewConfigurations, isViewConfigEnabled])

  const createViewConfiguration = useCallback(async (
    config: Omit<ViewConfiguration, "id" | "created_at" | "updated_at">
  ): Promise<ViewConfiguration> => {
    // Throw error if feature is disabled
    if (!isViewConfigEnabled) {
      throw new Error("View configurations feature is not enabled")
    }
    
    try {
      const response = await sdk.admin.views.createConfiguration(config.entity, config)
      const newConfig = response.view_configuration
      
      // Update the cache by adding the new view
      const existingViews = viewConfigurations.get(config.entity) || []
      viewConfigurations.set(config.entity, [...existingViews, newConfig])
      
      // If set_active was true, update the active view
      if ((config as any).set_active) {
        activeViews.set(config.entity, newConfig)
        activeViewMetadata.set(config.entity, { is_default_active: false })
        defaultActiveEntities.delete(config.entity)
      }
      
      // Force re-render
      forceUpdate({})
      
      return newConfig
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create view"
      toast.error(errorMessage)
      throw error
    }
  }, [viewConfigurations, activeViews, activeViewMetadata, defaultActiveEntities, isViewConfigEnabled])

  const updateViewConfiguration = useCallback(async (
    id: string, 
    config: Partial<ViewConfiguration>
  ): Promise<ViewConfiguration> => {
    // Throw error if feature is disabled
    if (!isViewConfigEnabled) {
      throw new Error("View configurations feature is not enabled")
    }
    
    try {
      // Need to find entity for the update
      const configs = Array.from(viewConfigurations.values()).flat()
      const existingConfig = configs.find(c => c.id === id)
      if (!existingConfig) throw new Error('Configuration not found')
      
      const response = await sdk.admin.views.updateConfiguration(existingConfig.entity, id, config)
      const updatedConfig = response.view_configuration
      
      // Update the cache instead of invalidating it
      if (updatedConfig.entity) {
        const existingViews = viewConfigurations.get(updatedConfig.entity) || []
        const updatedViews = existingViews.map(view => 
          view.id === id ? updatedConfig : view
        )
        viewConfigurations.set(updatedConfig.entity, updatedViews)
        
        // Update active view if it's the one being updated
        const activeView = activeViews.get(updatedConfig.entity)
        if (activeView?.id === id) {
          activeViews.set(updatedConfig.entity, updatedConfig)
        }
        
        // If set_active was true, update the active view
        if ((config as any).set_active) {
          activeViews.set(updatedConfig.entity, updatedConfig)
          activeViewMetadata.set(updatedConfig.entity, { is_default_active: false })
          defaultActiveEntities.delete(updatedConfig.entity)
        }
        
        // Force re-render
        forceUpdate({})
      }
      
      return updatedConfig
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update view"
      toast.error(errorMessage)
      throw error
    }
  }, [viewConfigurations, activeViews, activeViewMetadata, defaultActiveEntities, isViewConfigEnabled])

  const deleteViewConfiguration = useCallback(async (id: string) => {
    // Throw error if feature is disabled
    if (!isViewConfigEnabled) {
      throw new Error("View configurations feature is not enabled")
    }
    
    try {
      // First get the config to know which entity to invalidate
      const configs = Array.from(viewConfigurations.values()).flat()
      const configToDelete = configs.find(c => c.id === id)
      
      await sdk.admin.views.deleteConfiguration(configToDelete.entity, id)
      
      // Update the cache by removing the deleted view
      if (configToDelete) {
        const existingViews = viewConfigurations.get(configToDelete.entity) || []
        const updatedViews = existingViews.filter(view => view.id !== id)
        viewConfigurations.set(configToDelete.entity, updatedViews)
        
        // Remove from active views if it was active
        const activeView = activeViews.get(configToDelete.entity)
        if (activeView?.id === id) {
          activeViews.delete(configToDelete.entity)
          activeViewMetadata.delete(configToDelete.entity)
        }
        
        // Force re-render
        forceUpdate({})
      }
    } catch (error) {
      toast.error("Failed to delete view")
      throw error
    }
  }, [viewConfigurations, activeViews, activeViewMetadata, isViewConfigEnabled])

  const invalidateCache = useCallback((entity: string) => {
    viewConfigurations.delete(entity)
    activeViews.delete(entity)
    isLoading.delete(entity)
  }, [viewConfigurations, activeViews, isLoading])

  return (
    <ViewConfigurationContext.Provider
      value={{
        viewConfigurations,
        activeViews,
        isLoading,
        defaultActiveEntities,
        activeViewMetadata,
        getViewConfigurations,
        getActiveView,
        setActiveView,
        createViewConfiguration,
        updateViewConfiguration,
        deleteViewConfiguration,
        invalidateCache,
      }}
    >
      {children}
    </ViewConfigurationContext.Provider>
  )
}