import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules, ProductEvents } from "@medusajs/framework/utils";

export default async function imageDeletedHandler({ event, container }: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const fileModuleService = container.resolve(Modules.FILE)

    logger.info('[imageDeletedHandler] executing')

    const { data: [image] } = await query.graph({
        entity: 'product_image',
        fields: ['url'],
        filters: {
            id: event.data.id
        },
    })

    const url  = image?.url
    if (!url) {
        return
    }

    const fileProvider = fileModuleService.getProvider()
    if (!fileProvider.deleteByUrl) {
        logger.warn(`Unable to delete file ${url} 'deleteByUrl' method not implemented in current file provider`)
        return
    }

    try {
        await fileProvider.deleteByUrl(url)
        logger.info(`File ${url} deleted automatically upon image deletion`)
    } catch (error) {
        logger.error(`Failed to delete file ${url} with currently installed file provider: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
    }
}

export const config: SubscriberConfig = {
    event: [ProductEvents.PRODUCT_IMAGE_DELETED],
    context: {
        subscriberId: 'image-deleted-handler'
    }
}