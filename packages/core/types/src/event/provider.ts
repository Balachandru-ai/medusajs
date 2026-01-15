import {
  InterceptorSubscriber,
  Message,
  Subscriber,
  SubscriberContext,
  SubscriberDescriptor,
} from "../event-bus/common"

/**
 * ### constructor
 *
 * The constructor allows you to access resources from the module's container using the first parameter,
 * and the module's options using the second parameter.
 *
 * If you're creating a client or establishing a connection with a third-party service, do it in the constructor.
 *
 * #### Example
 *
 * ```ts
 * import { IEventProvider } from "@medusajs/framework/types"
 * import { Logger } from "@medusajs/framework/types"
 *
 * type InjectedDependencies = {
 *   logger: Logger
 * }
 *
 * type Options = {
 *   url: string
 * }
 *
 * class MyEventProviderService implements IEventProvider {
 *   static identifier = "my-event"
 *   protected logger_: Logger
 *   protected options_: Options
 *
 *   constructor (
 *     { logger }: InjectedDependencies,
 *     options: Options
 *   ) {
 *     this.logger_ = logger
 *     this.options_ = options
 *   }
 *
 *   // ...
 * }
 *
 * export default MyEventProviderService
 * ```
 *
 * ### Identifier
 *
 * Every event module provider must have an `identifier` static property. The provider's ID
 * will be stored as `ep_{identifier}`.
 *
 * For example:
 *
 * ```ts
 * class MyEventProviderService implements IEventProvider {
 *   static identifier = "my-event"
 *   // ...
 * }
 * ```
 */
export interface IEventProvider {
  __hooks?: {
    onApplicationStart?: () => Promise<void>
    onApplicationShutdown?: () => Promise<void>
    onApplicationPrepareShutdown?: () => Promise<void>
  }

  /**
   * A map of event names to their subscriber descriptors.
   * Used by the module service to check which events have subscribers.
   */
  get eventToSubscribersMap(): Map<string | symbol, SubscriberDescriptor[]>

  /**
   * This method emits one or more events. Subscribers listening to the event(s) are executed asynchronously.
   * The Event Module uses this method when you call its `emit` method.
   *
   * @param data - The details of the events to emit.
   * @param options - Additional options for the event.
   *
   * @example
   * ```ts
   * class MyEventProviderService implements IEventProvider {
   *   // ...
   *   async emit<T>(
   *     data: Message<T> | Message<T>[],
   *     options?: Record<string, unknown>
   *   ): Promise<void> {
   *     const events = Array.isArray(data) ? data : [data]
   *     for (const event of events) {
   *       // emit event to subscribers
   *     }
   *   }
   * }
   * ```
   */
  emit<T>(
    data: Message<T> | Message<T>[],
    options?: Record<string, unknown>
  ): Promise<void>

  /**
   * This method adds a subscriber to an event. The Event Module uses this method when you call its `subscribe` method.
   *
   * @param eventName - The name of the event to subscribe to.
   * @param subscriber - The subscriber function to execute when the event is emitted.
   * @param context - The context of the subscriber.
   * @returns The provider instance for chaining.
   *
   * @example
   * ```ts
   * class MyEventProviderService implements IEventProvider {
   *   // ...
   *   subscribe(
   *     eventName: string | symbol,
   *     subscriber: Subscriber,
   *     context?: SubscriberContext
   *   ): this {
   *     // register subscriber for the event
   *     return this
   *   }
   * }
   * ```
   */
  subscribe(
    eventName: string | symbol,
    subscriber: Subscriber,
    context?: SubscriberContext
  ): this

  /**
   * This method removes a subscriber from an event. The Event Module uses this method when you call its `unsubscribe` method.
   *
   * @param eventName - The name of the event to unsubscribe from.
   * @param subscriber - The subscriber function to remove.
   * @param context - The context of the subscriber.
   * @returns The provider instance for chaining.
   *
   * @example
   * ```ts
   * class MyEventProviderService implements IEventProvider {
   *   // ...
   *   unsubscribe(
   *     eventName: string | symbol,
   *     subscriber: Subscriber,
   *     context?: SubscriberContext
   *   ): this {
   *     // remove subscriber from the event
   *     return this
   *   }
   * }
   * ```
   */
  unsubscribe(
    eventName: string | symbol,
    subscriber: Subscriber,
    context?: SubscriberContext
  ): this

  /**
   * This method emits all events in the specified group. Grouped events are useful when you have distributed transactions
   * where you need to explicitly group, release and clear events upon lifecycle events of a transaction.
   *
   * @param eventGroupId - The ID of the event group.
   *
   * @example
   * ```ts
   * class MyEventProviderService implements IEventProvider {
   *   // ...
   *   async releaseGroupedEvents(eventGroupId: string): Promise<void> {
   *     // retrieve grouped events and emit them
   *   }
   * }
   * ```
   */
  releaseGroupedEvents(eventGroupId: string): Promise<void>

  /**
   * This method removes all events in the specified group. Grouped events are useful when you have distributed transactions
   * where you need to explicitly group, release and clear events upon lifecycle events of a transaction.
   *
   * @param eventGroupId - The ID of the event group.
   * @param options - Additional options for the event.
   * @param options.eventNames - The names of the events to clear. If not provided, the group will be entirely cleared.
   *
   * @example
   * ```ts
   * class MyEventProviderService implements IEventProvider {
   *   // ...
   *   async clearGroupedEvents(
   *     eventGroupId: string,
   *     options?: { eventNames?: string[] }
   *   ): Promise<void> {
   *     // clear grouped events
   *   }
   * }
   * ```
   */
  clearGroupedEvents(
    eventGroupId: string,
    options?: {
      eventNames?: string[]
    }
  ): Promise<void>

  /**
   * This method adds an interceptor to the event provider. The interceptor will be
   * called before the event is emitted.
   *
   * @param interceptor - The interceptor to add.
   * @returns The provider instance for chaining.
   */
  addInterceptor?(interceptor: InterceptorSubscriber): this

  /**
   * This method removes an interceptor from the event provider.
   *
   * @param interceptor - The interceptor to remove.
   * @returns The provider instance for chaining.
   */
  removeInterceptor?(interceptor: InterceptorSubscriber): this
}
