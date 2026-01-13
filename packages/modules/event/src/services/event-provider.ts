import {
  Constructor,
  IEventProvider,
  Logger,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { EventProviderRegistrationPrefix } from "@types"

type InjectedDependencies = {
  [key: `ep_${string}`]: IEventProvider
  logger?: Logger
}

export default class EventProviderService {
  protected __container__: InjectedDependencies
  #logger: Logger

  constructor(container: InjectedDependencies) {
    this.__container__ = container
    this.#logger = container["logger"]
      ? container.logger!
      : (console as unknown as Logger)
  }

  static getRegistrationIdentifier(
    providerClass: Constructor<IEventProvider>
  ) {
    if (!(providerClass as any).identifier) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        `Trying to register an event provider without an identifier.`
      )
    }
    return `${(providerClass as any).identifier}`
  }

  public retrieveProviderRegistration(providerId: string): IEventProvider {
    try {
      return this.__container__[
        `${EventProviderRegistrationPrefix}${providerId}`
      ]
    } catch (err) {
      if (err.name === "AwilixResolutionError") {
        const errMessage = `
Unable to retrieve the event provider with id: ${providerId}
Please make sure that the provider is registered in the container and it is configured correctly in your project configuration file.`

        // Log full error for debugging
        this.#logger.error(`AwilixResolutionError: ${err.message}`, err)

        throw new Error(errMessage)
      }

      const errMessage = `Unable to retrieve the event provider with id: ${providerId}, the following error occurred: ${err.message}`
      this.#logger.error(errMessage)

      throw new Error(errMessage)
    }
  }
}
