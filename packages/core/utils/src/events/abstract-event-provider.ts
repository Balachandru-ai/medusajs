import {
  EventBusTypes,
  EventsTypes,
  InterceptorSubscriber,
  Logger,
} from "@medusajs/types"
import { ulid } from "ulid"

/**
 * Abstract base class for event providers.
 *
 * Event providers handle the actual event emission and subscription management.
 * Built-in providers include local (EventEmitter-based) and Redis (BullMQ-based).
 *
 * @example
 * ```ts
 * import { AbstractEventsProvider } from "@medusajs/framework/utils"
 *
 * class MyEventProvider extends AbstractEventsProvider {
 *   static identifier = "my-event-provider"
 *
 *   async emit<T>(data, options): Promise<void> {
 *     // implementation
 *   }
 *
 *   async releaseGroupedEvents(eventGroupId: string): Promise<void> {
 *     // implementation
 *   }
 *
 *   async clearGroupedEvents(eventGroupId: string, options): Promise<void> {
 *     // implementation
 *   }
 * }
 * ```
 */
export abstract class AbstractEventsProvider<TConfig = Record<string, unknown>>
  implements EventsTypes.IEventsProvider
{
  /**
   * Each event provider has a unique identifier defined in its class.
   * The provider's ID will be stored as `ep_{identifier}_{id}`, where `{id}` is
   * the provider's `id` property in the `medusa-config.ts`.
   *
   * @example
   * ```ts
   * class MyEventProvider extends AbstractEventsProvider {
   *   static identifier = "my-event"
   *   // ...
   * }
   * ```
   */
  public static identifier: string

  /**
   * @ignore
   */
  static _isEventProvider = true

  /**
   * @ignore
   */
  static isEventProvider(object): boolean {
    return object?.constructor?._isEventProvider
  }

  /**
   * This method validates the options of the provider set in `medusa-config.ts`.
   * Implementing this method is optional, but it's useful to ensure that the required
   * options are passed to the provider, or if you have any custom validation logic.
   *
   * If the options aren't valid, throw an error.
   *
   * @param options - The provider's options passed in `medusa-config.ts`.
   *
   * @example
   * ```ts
   * class MyEventProvider extends AbstractEventsProvider<Options> {
   *   static validateOptions(options: Record<any, any>) {
   *     if (!options.redisUrl) {
   *       throw new MedusaError(
   *         MedusaError.Types.INVALID_DATA,
   *         "Redis URL is required in the provider's options."
   *       )
   *     }
   *   }
   * }
   * ```
   */
  static validateOptions(options: Record<any, any>): void | never {}

  /**
   * @ignore
   */
  protected readonly container: Record<string, unknown>

  /**
   * @ignore
   */
  protected readonly config: TConfig

  protected readonly logger_: Logger

  /**
   * Map of event names to their subscriber descriptors.
   */
  protected eventToSubscribersMap_: Map<
    string | symbol,
    EventBusTypes.SubscriberDescriptor[]
  > = new Map()

  /**
   * Set of interceptor subscribers that receive all messages before emission.
   */
  protected interceptorSubscribers_: Set<InterceptorSubscriber> = new Set()

  /**
   * The constructor allows you to access resources from the module's container using the first parameter,
   * and the module's options using the second parameter.
   *
   * If you're creating a client or establishing a connection with a third-party service, do it in the constructor.
   *
   * @param cradle - The module's container used to resolve resources.
   * @param config - The options passed to the event provider.
   *
   * @example
   * ```ts
   * import { AbstractEventsProvider } from "@medusajs/framework/utils"
   * import { Logger } from "@medusajs/framework/types"
   *
   * type Options = {
   *   redisUrl: string
   * }
   *
   * type InjectedDependencies = {
   *   logger: Logger
   * }
   *
   * class MyEventProvider extends AbstractEventsProvider<Options> {
   *   protected logger_: Logger
   *   protected options_: Options
   *
   *   constructor(
   *     container: InjectedDependencies,
   *     options: Options
   *   ) {
   *     super(container, options)
   *
   *     this.logger_ = container.logger
   *     this.options_ = options
   *   }
   *   // ...
   * }
   * ```
   */
  protected constructor(
    cradle: Record<string, unknown>,
    config: TConfig = {} as TConfig
  ) {
    this.container = cradle
    this.config = config
    this.logger_ = ("logger" in cradle ? cradle.logger : console) as Logger
  }

  /**
   * Get the map of event names to their subscriber descriptors.
   * Used by the module service to check which events have subscribers.
   */
  public get eventToSubscribersMap(): Map<
    string | symbol,
    EventBusTypes.SubscriberDescriptor[]
  > {
    return this.eventToSubscribersMap_
  }

  /**
   * Return the unique identifier for the event provider.
   * @ignore
   */
  public getIdentifier(): string {
    const ctr = this.constructor as typeof AbstractEventsProvider

    if (!ctr.identifier) {
      throw new Error(`Missing static property "identifier".`)
    }

    return ctr.identifier
  }

  /**
   * This method emits one or more events. Subscribers listening to the event(s) are executed asynchronously.
   *
   * @param data - The details of the events to emit.
   * @param options - Additional options for the event.
   */
  abstract emit<T>(
    data: EventBusTypes.Message<T> | EventBusTypes.Message<T>[],
    options?: Record<string, unknown>
  ): Promise<void>

  /**
   * This method emits all events in the specified group.
   *
   * @param eventGroupId - The ID of the event group.
   */
  abstract releaseGroupedEvents(eventGroupId: string): Promise<void>

  /**
   * This method removes all events in the specified group.
   *
   * @param eventGroupId - The ID of the event group.
   * @param options - Additional options for the event.
   */
  abstract clearGroupedEvents(
    eventGroupId: string,
    options?: {
      eventNames?: string[]
    }
  ): Promise<void>

  /**
   * Store a subscriber for a specific event.
   *
   * @param params - The event, subscriber ID, and subscriber function.
   * @protected
   */
  protected storeSubscribers({
    event,
    subscriberId,
    subscriber,
  }: {
    event: string | symbol
    subscriberId: string
    subscriber: EventBusTypes.Subscriber
  }) {
    const newSubscriberDescriptor = { subscriber, id: subscriberId }

    const existingSubscribers = this.eventToSubscribersMap_.get(event) ?? []

    const subscriberAlreadyExists = existingSubscribers.find(
      (sub) => sub.id === subscriberId
    )

    if (subscriberAlreadyExists) {
      throw Error(`Subscriber with id ${subscriberId} already exists`)
    }

    this.eventToSubscribersMap_.set(event, [
      ...existingSubscribers,
      newSubscriberDescriptor,
    ])
  }

  /**
   * Subscribe to an event.
   *
   * @param eventName - The name of the event to subscribe to.
   * @param subscriber - The subscriber function to execute when the event is emitted.
   * @param context - The context of the subscriber.
   * @returns The provider instance for chaining.
   */
  public subscribe(
    eventName: string | symbol,
    subscriber: EventBusTypes.Subscriber,
    context?: EventBusTypes.SubscriberContext
  ): this {
    if (typeof subscriber !== `function`) {
      throw new Error("Subscriber must be a function")
    }

    const event = eventName.toString()
    const subscriberId = context?.subscriberId ?? `${event}-${ulid()}`

    ;(subscriber as any).subscriberId = subscriberId

    this.storeSubscribers({
      event,
      subscriberId,
      subscriber,
    })

    return this
  }

  /**
   * Unsubscribe from an event.
   *
   * @param eventName - The name of the event to unsubscribe from.
   * @param subscriber - The subscriber function to remove.
   * @param context - The context of the subscriber.
   * @returns The provider instance for chaining.
   */
  public unsubscribe(
    eventName: string | symbol,
    subscriber: EventBusTypes.Subscriber,
    context?: EventBusTypes.SubscriberContext
  ): this {
    const existingSubscribers = this.eventToSubscribersMap_.get(eventName)
    const subscriberId =
      context?.subscriberId ?? (subscriber as any).subscriberId

    if (existingSubscribers?.length) {
      const subIndex = existingSubscribers?.findIndex(
        (sub) => sub.id === subscriberId
      )

      if (subIndex !== -1) {
        this.eventToSubscribersMap_
          .get(eventName)
          ?.splice(subIndex as number, 1)
      }
    }

    return this
  }

  /**
   * Add an interceptor subscriber that receives all messages before they are emitted.
   *
   * @param interceptor - Function that receives messages before emission.
   * @returns The provider instance for chaining.
   */
  public addInterceptor(interceptor: InterceptorSubscriber): this {
    this.interceptorSubscribers_.add(interceptor)
    return this
  }

  /**
   * Remove an interceptor subscriber.
   *
   * @param interceptor - Function to remove from interceptors.
   * @returns The provider instance for chaining.
   */
  public removeInterceptor(interceptor: InterceptorSubscriber): this {
    this.interceptorSubscribers_.delete(interceptor)
    return this
  }

  /**
   * Call all interceptor subscribers with the message before emission.
   * This should be called by implementations before emitting events.
   *
   * @param message - The message to be intercepted.
   * @param context - Optional context about the emission.
   * @protected
   */
  protected async callInterceptors<T = unknown>(
    message: EventBusTypes.Message<T>,
    context?: { isGrouped?: boolean; eventGroupId?: string }
  ): Promise<void> {
    Array.from(this.interceptorSubscribers_).map(async (interceptor) => {
      try {
        await interceptor(message, context)
      } catch (error) {
        // Log error but don't stop other interceptors or the emission
        this.logger_.error("Error in event bus interceptor:", error)
      }
    })
  }
}
