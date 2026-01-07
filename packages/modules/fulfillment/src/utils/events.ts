import {
  Fulfillment,
  FulfillmentSet,
  GeoZone,
  ServiceZone,
  ShippingOption,
  ShippingOptionRule,
  ShippingOptionType,
} from "@models"
import { Context, InferEntityType } from "@medusajs/framework/types"
import {
  CommonEvents,
  FulfillmentEvents,
  moduleEventBuilderFactory,
  Modules,
} from "@medusajs/framework/utils"

export const eventBuilders = {
  createdFulfillment: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "fulfillment",
  }),
  updatedFulfillment: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "fulfillment",
  }),
  createdFulfillmentAddress: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "fulfillment_address",
  }),
  createdFulfillmentItem: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "fulfillment_item",
  }),
  createdFulfillmentLabel: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "fulfillment_label",
  }),
  updatedFulfillmentLabel: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "fulfillment_label",
  }),
  deletedFulfillmentLabel: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.DELETED,
    object: "fulfillment_label",
  }),
  createdShippingProfile: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "shipping_profile",
  }),
  createdShippingOptionType: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "shipping_option_type",
  }),
  updatedShippingOptionType: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "shipping_option_type",
  }),
  deletedShippingOptionType: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.DELETED,
    object: "shipping_option_type",
  }),
  createdShippingOptionRule: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "shipping_option_rule",
  }),
  updatedShippingOptionRule: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "shipping_option_rule",
  }),
  deletedShippingOptionRule: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.DELETED,
    object: "shipping_option_rule",
  }),
  createdShippingOption: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "shipping_option",
  }),
  updatedShippingOption: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "shipping_option",
  }),
  createdFulfillmentSet: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "fulfillment_set",
  }),
  updatedFulfillmentSet: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "fulfillment_set",
  }),
  deletedFulfillmentSet: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.DELETED,
    object: "fulfillment_set",
  }),
  createdServiceZone: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "service_zone",
  }),
  updatedServiceZone: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "service_zone",
  }),
  deletedServiceZone: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.DELETED,
    object: "service_zone",
  }),
  createdGeoZone: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.CREATED,
    object: "geo_zone",
  }),
  updatedGeoZone: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.UPDATED,
    object: "geo_zone",
  }),
  deletedGeoZone: moduleEventBuilderFactory({
    source: Modules.FULFILLMENT,
    action: CommonEvents.DELETED,
    object: "geo_zone",
  }),
}

export function buildCreatedFulfillmentEvents({
  fulfillments,
  sharedContext,
}: {
  fulfillments: InferEntityType<typeof Fulfillment>[]
  sharedContext: Context
}) {
  if (!fulfillments.length) {
    return
  }

  const fulfillments_: { id: string }[] = []
  const addresses: { id: string }[] = []
  const items: { id: string }[] = []
  const labels: { id: string }[] = []

  fulfillments.forEach((fulfillment) => {
    fulfillments_.push({ id: fulfillment.id })

    if (fulfillment.delivery_address) {
      addresses.push({ id: fulfillment.delivery_address.id })
    }

    if (fulfillment.items) {
      items.push(...fulfillment.items)
    }

    if (fulfillment.labels) {
      labels.push(...fulfillment.labels)
    }
  })

  eventBuilders.createdFulfillment({ data: fulfillments_, sharedContext })
  eventBuilders.createdFulfillmentAddress({ data: addresses, sharedContext })
  eventBuilders.createdFulfillmentItem({ data: items, sharedContext })
  eventBuilders.createdFulfillmentLabel({ data: labels, sharedContext })
}

export function buildCreatedShippingOptionEvents({
  shippingOptions,
  sharedContext,
}: {
  shippingOptions: InferEntityType<typeof ShippingOption>[]
  sharedContext: Context
}) {
  if (!shippingOptions.length) {
    return
  }

  const options: { id: string }[] = []
  const types: InferEntityType<typeof ShippingOptionType>[] = []
  const rules: InferEntityType<typeof ShippingOptionRule>[] = []

  shippingOptions.forEach((shippingOption) => {
    options.push({ id: shippingOption.id })

    if (shippingOption.type) {
      types.push(shippingOption.type)
    }

    if (shippingOption.rules) {
      rules.push(...shippingOption.rules)
    }
  })

  eventBuilders.createdShippingOption({ data: options, sharedContext })
  eventBuilders.createdShippingOptionType({ data: types, sharedContext })
  eventBuilders.createdShippingOptionRule({ data: rules, sharedContext })
}

export function buildCreatedFulfillmentSetEvents({
  fulfillmentSets,
  sharedContext,
}: {
  fulfillmentSets: InferEntityType<typeof FulfillmentSet>[]
  sharedContext: Context
}): void {
  if (!fulfillmentSets.length) {
    return
  }

  const serviceZones: InferEntityType<typeof ServiceZone>[] = []

  fulfillmentSets.forEach((fulfillmentSet) => {
    if (!fulfillmentSet.service_zones?.length) {
      return
    }

    serviceZones.push(...fulfillmentSet.service_zones)
  })

  eventBuilders.createdFulfillmentSet({ data: fulfillmentSets, sharedContext })

  buildCreatedServiceZoneEvents({ serviceZones, sharedContext })
}

export function buildCreatedServiceZoneEvents({
  serviceZones,
  sharedContext,
}: {
  serviceZones: InferEntityType<typeof ServiceZone>[]
  sharedContext: Context
}): void {
  if (!serviceZones.length) {
    return
  }

  const geoZones: InferEntityType<typeof GeoZone>[] = []

  serviceZones.forEach((serviceZone) => {
    if (!serviceZone.geo_zones.length) {
      return
    }

    geoZones.push(...serviceZone.geo_zones)
  })

  eventBuilders.createdServiceZone({ data: serviceZones, sharedContext })
  eventBuilders.createdGeoZone({ data: geoZones, sharedContext })
}
