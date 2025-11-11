import type { Express } from "express"

// Use any type for Vite to avoid build-time dependency
type ViteDevServer = any

/**
 * Module types that can be hot reloaded
 */
export enum ModuleType {
  ROUTE = "route",
  MIDDLEWARE = "middleware",
  SUBSCRIBER = "subscriber",
  WORKFLOW = "workflow",
  PLUGIN = "plugin",
}

/**
 * Metadata for a tracked module
 */
export interface ModuleMetadata {
  /** Absolute file path */
  filePath: string
  /** Module type */
  type: ModuleType
  /** Timestamp when module was loaded */
  loadedAt: number
  /** Module dependencies (other files this module imports) */
  dependencies: Set<string>
  /** Cleanup function to run before reload */
  cleanup?: () => void | Promise<void>
  /** Additional type-specific metadata */
  meta?: Record<string, any>
}

/**
 * Route-specific metadata
 */
export interface RouteMetadata extends ModuleMetadata {
  type: ModuleType.ROUTE
  meta: {
    /** HTTP method (GET, POST, etc.) */
    method: string
    /** Route path */
    path: string
    /** Reference to Express layer for removal */
    layer?: any
  }
}

/**
 * Subscriber-specific metadata
 */
export interface SubscriberMetadata extends ModuleMetadata {
  type: ModuleType.SUBSCRIBER
  meta: {
    /** Event name being listened to */
    eventName: string
    /** Subscriber ID for tracking */
    subscriberId: string
  }
}

/**
 * Configuration for the HMR dev server
 */
export interface DevServerConfig {
  /** Project root directory */
  root: string
  /** Port for the dev server (default: 9000) */
  port?: number
  /** Enable verbose logging */
  verbose?: boolean
  /** Patterns to exclude from watching */
  exclude?: string[]
  /** Enable type checking in parallel (optional) */
  typeCheck?: boolean
}

/**
 * HMR update event
 */
export interface HmrUpdate {
  /** Type of update */
  type: "add" | "change" | "unlink"
  /** File path that changed */
  path: string
  /** Modules affected by this change */
  affectedModules: ModuleMetadata[]
  /** Timestamp of the update */
  timestamp: number
}

/**
 * Route registry for tracking loaded routes
 */
export interface RouteRegistry {
  /** Register a route */
  register: (metadata: RouteMetadata) => void
  /** Register multiple routes from the same file */
  registerMany: (filePath: string, routes: RouteMetadata[]) => void
  /** Get routes for a specific file */
  getByFile: (filePath: string) => RouteMetadata[] | undefined
  /** Get all tracked routes */
  getAll: () => Map<string, RouteMetadata[]>
  /** Unregister routes for a file */
  unregister: (filePath: string, app: Express) => Promise<boolean>
  /** Clear all routes */
  clear: () => void
  /** Get statistics */
  getStats: () => {
    totalFiles: number
    totalRoutes: number
    byMethod: Record<string, number>
  }
}

/**
 * Dev server instance
 */
export interface DevServerInstance {
  /** Vite dev server */
  vite: ViteDevServer
  /** Express app */
  app: Express
  /** Module registry for tracking loaded modules */
  registry: ModuleRegistry
  /** Route registry for tracking routes specifically */
  routeRegistry: RouteRegistry
  /** Start the dev server */
  start: () => Promise<void>
  /** Stop the dev server */
  stop: () => Promise<void>
  /** Reload specific modules */
  reload: (filePaths: string[]) => Promise<void>
}

/**
 * Module registry for tracking loaded modules and their metadata
 */
export interface ModuleRegistry {
  /** Register a new module */
  register: (metadata: ModuleMetadata) => void
  /** Unregister a module */
  unregister: (filePath: string) => void
  /** Get module metadata */
  get: (filePath: string) => ModuleMetadata | undefined
  /** Get all modules of a specific type */
  getByType: (type: ModuleType) => ModuleMetadata[]
  /** Get modules that depend on a given file */
  getDependents: (filePath: string) => ModuleMetadata[]
  /** Clear all modules */
  clear: () => void
  /** Get all tracked modules */
  getAll: () => Map<string, ModuleMetadata>
}
