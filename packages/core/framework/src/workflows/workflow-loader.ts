import { MedusaContainer } from "@medusajs/types"
import { ResourceLoader } from "../utils/resource-loader"

export class WorkflowLoader extends ResourceLoader {
  protected resourceName = "workflow"

  constructor(sourceDir: string | string[], container: MedusaContainer) {
    super(sourceDir, container)
  }

  protected async onFileLoaded(
    path: string,
    fileExports: Record<string, unknown>
  ) {
    this.logger.debug(`Registering workflows from ${path}.`)
  }

  /**
   * Load workflows from the source paths, workflows are registering themselves,
   * therefore we only need to import them
   */
  async load() {
    await super.discoverResources()

    this.logger.debug(`Workflows registered.`)
  }
}
