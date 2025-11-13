import type { WorkflowMetadata } from "./types"

/**
 * Registry for tracking loaded workflows with their metadata
 * This allows us to unregister and re-register workflows for hot reload
 */
export class WorkflowRegistry {
  /**
   * Map of file paths to workflow metadata
   * Key: absolute file path
   * Value: array of workflow metadata (one file can export multiple workflows)
   */
  private workflows: Map<string, WorkflowMetadata[]> = new Map()

  /**
   * Register a workflow with its metadata
   */
  register(metadata: WorkflowMetadata): void {
    const existing = this.workflows.get(metadata.filePath) || []
    existing.push(metadata)
    this.workflows.set(metadata.filePath, existing)
  }

  /**
   * Register multiple workflows from the same file
   */
  registerMany(filePath: string, workflows: WorkflowMetadata[]): void {
    this.workflows.set(filePath, workflows)
  }

  /**
   * Get all workflows for a specific file
   */
  getByFile(filePath: string): WorkflowMetadata[] | undefined {
    return this.workflows.get(filePath)
  }

  /**
   * Get all tracked workflows
   */
  getAll(): Map<string, WorkflowMetadata[]> {
    return new Map(this.workflows)
  }

  /**
   * Unregister workflows for a specific file
   * This removes them from the workflow system and our registry
   */
  async unregister(filePath: string): Promise<boolean> {
    const workflows = this.workflows.get(filePath)
    if (!workflows) {
      return false
    }

    // Remove each workflow from the workflow system
    for (const workflow of workflows) {
      try {
        // Run cleanup if provided
        if (workflow.cleanup) {
          await workflow.cleanup()
        }
      } catch (error) {
        console.warn(
          `[HMR] Failed to cleanup workflow ${workflow.meta.workflowName}:`,
          error
        )
      }
    }

    // Remove from our registry
    this.workflows.delete(filePath)
    return true
  }

  /**
   * Clear all workflows
   */
  clear(): void {
    this.workflows.clear()
  }

  /**
   * Get statistics about tracked workflows
   */
  getStats(): {
    totalFiles: number
    totalWorkflows: number
  } {
    let totalWorkflows = 0

    for (const workflows of this.workflows.values()) {
      totalWorkflows += workflows.length
    }

    return {
      totalFiles: this.workflows.size,
      totalWorkflows,
    }
  }
}

/**
 * Create a new workflow registry instance
 */
export function createWorkflowRegistry(): WorkflowRegistry {
  return new WorkflowRegistry()
}
