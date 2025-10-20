import { Logger, NotificationTypes } from "@medusajs/framework/types"
import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import { MedusaCloudEmailOptions } from "@types"

export class MedusaCloudEmailNotificationProvider extends AbstractNotificationProviderService {
  static identifier = "notification-medusa-cloud-email"
  protected options_: MedusaCloudEmailOptions
  protected logger_: Logger

  constructor({}, options: MedusaCloudEmailOptions) {
    super()

    this.options_ = options
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    const { channel, ...httpNotification } = notification // no need to send the channel, since email is implied
    try {
      const response = await fetch(this.options_.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${this.options_.api_key}`,
          "x-medusa-environment-handle": this.options_.environment_handle,
        },
        body: JSON.stringify(httpNotification),
      })
      const responseBody = await response.json()

      if (!response.ok) {
        throw new Error(
          `Failed to send email: ${response.status} - ${response.statusText}: ${responseBody.message}`
        )
      }

      return { id: responseBody.id }
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }
}
