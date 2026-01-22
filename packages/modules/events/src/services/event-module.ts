import {
  EventsTypes,
  InterceptorSubscriber,
  InternalModuleDeclaration,
  Logger,
  Message,
  Subscriber,
  SubscriberContext,
} from "@medusajs/framework/types"
import { EventDefaultProvider } from "@types"
import EventsProviderService from "./event-provider"

type InjectedDependencies = {
  eventProviderService: EventsProviderService
  logger?: Logger
  [EventDefaultProvider]: string
}

export default class EventsModuleService
  implements EventsTypes.IEventsModuleService
{
  protected providerService_: EventsProviderService
  protected defaultProviderId: string

  constructor(
    container: InjectedDependencies,
    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    this.providerService_ = container.eventProviderService
    this.defaultProviderId = container[EventDefaultProvider]
  }

  /**
   * Lifecycle hooks that forward to provider hooks.
   * These are called by the MedusaModule during application lifecycle events.
   */
  __hooks = {
    onApplicationStart: async () => {
      const providers = this.providerService_.listProviders()
      await Promise.all(
        providers.map((provider) =>
          provider.__hooks?.onApplicationStart?.bind(provider)?.()
        )
      )
    },
    onApplicationShutdown: async () => {
      const providers = this.providerService_.listProviders()
      await Promise.all(
        providers.map((provider) =>
          provider.__hooks?.onApplicationShutdown?.bind(provider)?.()
        )
      )
    },
    onApplicationPrepareShutdown: async () => {
      const providers = this.providerService_.listProviders()
      await Promise.all(
        providers.map((provider) =>
          provider.__hooks?.onApplicationPrepareShutdown?.bind(provider)?.()
        )
      )
    },
  }

  private getProvider(providerId?: string) {
    const id = providerId ?? this.defaultProviderId
    return this.providerService_.retrieveProviderRegistration(id)
  }

  /**
   * This method emits one or more events. Subscribers listening to the event(s) are executed asynchronously.
   *
   * @param data - The details of the events to emit.
   * @param options - Additional options for the event.
   */
  async emit<T>(
    data: Message<T> | Message<T>[],
    options?: Record<string, unknown> & { provider?: string }
  ): Promise<void> {
    const provider = this.getProvider(options?.provider)
    return provider.emit(data, options)
  }

  /**
   * This method adds a subscriber to an event.
   *
   * @param eventName - The name of the event to subscribe to.
   * @param subscriber - The subscriber function to execute when the event is emitted.
   * @param context - The context of the subscriber.
   * @returns The instance of the Event Module
   */
  subscribe(
    eventName: string | symbol,
    subscriber: Subscriber,
    context?: SubscriberContext
  ): this {
    // Subscribe to all providers to ensure the subscriber receives events
    // regardless of which provider emits them
    const providers = this.providerService_.listProviders()
    for (const provider of providers) {
      provider.subscribe(eventName, subscriber, context)
    }
    return this
  }

  /**
   * This method removes a subscriber from an event.
   *
   * @param eventName - The name of the event to unsubscribe from.
   * @param subscriber - The subscriber function to remove.
   * @param context - The context of the subscriber.
   * @returns The instance of the Event Module
   */
  unsubscribe(
    eventName: string | symbol,
    subscriber: Subscriber,
    context?: SubscriberContext
  ): this {
    // Unsubscribe from all providers to ensure the subscriber is removed
    // regardless of which provider it was registered on
    const providers = this.providerService_.listProviders()
    for (const provider of providers) {
      provider.unsubscribe(eventName, subscriber, context)
    }
    return this
  }

  /**
   * This method emits all events in the specified group.
   *
   * @param eventGroupId - The ID of the event group.
   */
  async releaseGroupedEvents(eventGroupId: string): Promise<void> {
    const provider = this.getProvider()
    return provider.releaseGroupedEvents(eventGroupId)
  }

  /**
   * This method removes all events in the specified group.
   *
   * @param eventGroupId - The ID of the event group.
   * @param options - Additional options for the event.
   */
  async clearGroupedEvents(
    eventGroupId: string,
    options?: { eventNames?: string[] }
  ): Promise<void> {
    const provider = this.getProvider()
    return provider.clearGroupedEvents(eventGroupId, options)
  }

  /**
   * This method adds an interceptor to the event bus.
   *
   * @param interceptor - The interceptor to add.
   * @returns The instance of the Event Module
   */
  addInterceptor(interceptor: InterceptorSubscriber): this {
    // Add interceptor to all providers to ensure it intercepts events
    // regardless of which provider emits them
    const providers = this.providerService_.listProviders()
    for (const provider of providers) {
      provider.addInterceptor?.(interceptor)
    }
    return this
  }

  /**
   * This method removes an interceptor from the event bus.
   *
   * @param interceptor - The interceptor to remove.
   * @returns The instance of the Event Module
   */
  removeInterceptor(interceptor: InterceptorSubscriber): this {
    // Remove interceptor from all providers
    const providers = this.providerService_.listProviders()
    for (const provider of providers) {
      provider.removeInterceptor?.(interceptor)
    }
    return this
  }
}
