import type { ModuleMetadata, ModuleRegistry, ModuleType } from "./types"

/**
 * Implementation of ModuleRegistry for tracking loaded modules
 * and their dependencies for hot module replacement
 */
export class ModuleRegistryImpl implements ModuleRegistry {
  private modules: Map<string, ModuleMetadata> = new Map()

  /**
   * Register a new module with its metadata
   */
  register(metadata: ModuleMetadata): void {
    this.modules.set(metadata.filePath, metadata)
  }

  /**
   * Unregister a module and run its cleanup if provided
   */
  async unregister(filePath: string): Promise<void> {
    const metadata = this.modules.get(filePath)
    if (metadata?.cleanup) {
      await metadata.cleanup()
    }
    this.modules.delete(filePath)
  }

  /**
   * Get metadata for a specific module
   */
  get(filePath: string): ModuleMetadata | undefined {
    return this.modules.get(filePath)
  }

  /**
   * Get all modules of a specific type
   */
  getByType(type: ModuleType): ModuleMetadata[] {
    return Array.from(this.modules.values()).filter((m) => m.type === type)
  }

  /**
   * Get all modules that depend on the given file
   * This is crucial for invalidating dependent modules when a dependency changes
   */
  getDependents(filePath: string): ModuleMetadata[] {
    const dependents: ModuleMetadata[] = []

    for (const metadata of this.modules.values()) {
      if (metadata.dependencies.has(filePath)) {
        dependents.push(metadata)
      }
    }

    return dependents
  }

  /**
   * Clear all registered modules
   */
  clear(): void {
    this.modules.clear()
  }

  /**
   * Get all tracked modules
   */
  getAll(): Map<string, ModuleMetadata> {
    return new Map(this.modules)
  }

  /**
   * Get statistics about tracked modules
   */
  getStats(): {
    total: number
    byType: Record<string, number>
  } {
    const byType: Record<string, number> = {}

    for (const metadata of this.modules.values()) {
      byType[metadata.type] = (byType[metadata.type] || 0) + 1
    }

    return {
      total: this.modules.size,
      byType,
    }
  }
}

/**
 * Create a new module registry instance
 */
export function createModuleRegistry(): ModuleRegistry {
  return new ModuleRegistryImpl()
}
