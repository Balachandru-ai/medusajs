import type { LinkMetadata } from "./types"

/**
 * Registry for tracking loaded links with their metadata
 * This allows us to unregister and re-register links for hot reload
 */
export class LinkRegistry {
  /**
   * Map of file paths to link metadata
   * Key: absolute file path
   * Value: array of link metadata (one file can export multiple links)
   */
  private links: Map<string, LinkMetadata[]> = new Map()

  /**
   * Register a link with its metadata
   */
  register(metadata: LinkMetadata): void {
    const existing = this.links.get(metadata.filePath) || []
    existing.push(metadata)
    this.links.set(metadata.filePath, existing)
  }

  /**
   * Register multiple links from the same file
   */
  registerMany(filePath: string, links: LinkMetadata[]): void {
    this.links.set(filePath, links)
  }

  /**
   * Get all links for a specific file
   */
  getByFile(filePath: string): LinkMetadata[] | undefined {
    return this.links.get(filePath)
  }

  /**
   * Get all tracked links
   */
  getAll(): Map<string, LinkMetadata[]> {
    return new Map(this.links)
  }

  /**
   * Unregister links for a specific file
   * This removes them from the link system and our registry
   */
  async unregister(filePath: string): Promise<boolean> {
    const links = this.links.get(filePath)
    if (!links) {
      return false
    }

    // Remove each link from the link system
    for (const link of links) {
      try {
        // Run cleanup if provided
        if (link.cleanup) {
          await link.cleanup()
        }
      } catch (error) {
        console.warn(
          `[HMR] Failed to cleanup link ${link.meta.linkName}:`,
          error
        )
      }
    }

    // Remove from our registry
    this.links.delete(filePath)
    return true
  }

  /**
   * Clear all links
   */
  clear(): void {
    this.links.clear()
  }

  /**
   * Get statistics about tracked links
   */
  getStats(): {
    totalFiles: number
    totalLinks: number
  } {
    let totalLinks = 0

    for (const links of this.links.values()) {
      totalLinks += links.length
    }

    return {
      totalFiles: this.links.size,
      totalLinks,
    }
  }
}

/**
 * Create a new link registry instance
 */
export function createLinkRegistry(): LinkRegistry {
  return new LinkRegistry()
}
