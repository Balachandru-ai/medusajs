import { SubscriberLoader } from "@medusajs/framework/subscribers"
import {
  IEventBusModuleService,
  Logger,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ResourceRegistry } from "../resource-registry"
import { CONFIG, FileChangeAction } from "../types"

/**
 * Metadata for a registered subscriber
 */
interface SubscriberMetadata {
  subscriberId: string
  events: string[]
}

/**
 * Handles hot reloading of subscriber files with event-bus unregistration
 */
export class SubscriberReloader {
  #eventBusService: IEventBusModuleService | undefined

  constructor(
    private container: MedusaContainer,
    private registry: ResourceRegistry,
    private logSource: string,
    private logger: Logger
  ) {
    this.#eventBusService = container.resolve(Modules.EVENT_BUS, {
      allowUnregistered: true,
    }) as IEventBusModuleService
  }

  /**
   * Check if a file path represents a subscriber
   */
  private isSubscriberPath(filePath: string): boolean {
    return filePath.includes(CONFIG.RESOURCE_PATH_PATTERNS.subscriber)
  }

  /**
   * Unregister a subscriber from the event-bus
   */
  private unregisterSubscriber(metadata: SubscriberMetadata): void {
    if (!this.#eventBusService) {
      return
    }

    for (const event of metadata.events) {
      // Create a dummy subscriber function - the event-bus will use subscriberId to find the real one
      const dummySubscriber = async () => {}
      ;(dummySubscriber as any).subscriberId = metadata.subscriberId

      this.#eventBusService.unsubscribe(event, dummySubscriber as any, {
        subscriberId: metadata.subscriberId,
      })
    }

    this.logger.debug(
      `${this.logSource} Unregistered subscriber ${
        metadata.subscriberId
      } from events: ${metadata.events.join(", ")}`
    )
  }

  /**
   * Register a subscriber by loading the file and extracting its metadata
   */
  private registerSubscriber(absoluteFilePath: string): void {
    if (!this.#eventBusService) {
      return
    }

    try {
      // Load the subscriber module
      const subscriberModule = require(absoluteFilePath)

      new SubscriberLoader(
        absoluteFilePath,
        {},
        this.container
      ).createSubscriber({
        fileName: absoluteFilePath,
        config: subscriberModule.config,
        handler: subscriberModule.default,
      })

      this.logger.debug(
        `${this.logSource} Registered subscriber ${absoluteFilePath}`
      )
    } catch (error) {
      this.logger.error(
        `${this.logSource} Failed to register subscriber from ${absoluteFilePath}: ${error}`
      )
    }
  }

  /**
   * Clear require cache for a subscriber file
   */
  private clearSubscriberCache(absoluteFilePath: string): void {
    const resolved = require.resolve(absoluteFilePath)
    if (require.cache[resolved]) {
      delete require.cache[resolved]
    }
  }

  /**
   * Reload a subscriber file if necessary
   */
  async reload(
    action: FileChangeAction,
    absoluteFilePath: string
  ): Promise<void> {
    if (!this.isSubscriberPath(absoluteFilePath)) {
      return
    }

    if (!this.#eventBusService) {
      this.logger.error(
        `${this.logSource} EventBusService not available - cannot reload subscribers`
      )
      return
    }

    const existingResources = this.registry.getResources(absoluteFilePath)
    if (existingResources) {
      for (const [_, resources] of existingResources) {
        for (const resource of resources) {
          this.unregisterSubscriber({
            subscriberId: resource.id,
            events: resource.events,
          })
        }
      }
    }

    if (action === "add" || action === "change") {
      this.clearSubscriberCache(absoluteFilePath)
      this.registerSubscriber(absoluteFilePath)
    }
  }
}
