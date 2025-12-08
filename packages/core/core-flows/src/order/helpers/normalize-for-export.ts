import { OrderDTO } from "@medusajs/framework/types"

/**
 * Normalizes orders for CSV export.
 * Each order becomes one row, with line items flattened into columns.
 */
export const normalizeOrdersForExport = (orders: OrderDTO[]): object[] => {
  return orders.map((order) => normalizeOrderForExport(order))
}

const normalizeOrderForExport = (order: OrderDTO): object => {
  const result: Record<string, any> = {}

  // Order basic fields
  result["Order Id"] = order.id
  result["Order Display Id"] = order.display_id
  result["Order Status"] = order.status
  result["Order Created At"] = order.created_at
  result["Order Updated At"] = order.updated_at
  result["Order Currency Code"] = order.currency_code
  result["Order Region Id"] = order.region_id
  result["Order Email"] = order.email

  // Order totals
  result["Order Subtotal"] = order.subtotal
  result["Order Tax Total"] = order.tax_total
  result["Order Shipping Total"] = order.shipping_total
  result["Order Discount Total"] = order.discount_total
  result["Order Gift Card Total"] = order.gift_card_total
  result["Order Total"] = order.total

  // Customer info
  const customer = (order as any).customer
  if (customer) {
    result["Customer Id"] = customer.id
    result["Customer Email"] = customer.email
    result["Customer First Name"] = customer.first_name
    result["Customer Last Name"] = customer.last_name
    result["Customer Phone"] = customer.phone
  }

  // Shipping address
  const shippingAddress = (order as any).shipping_address
  if (shippingAddress) {
    result["Shipping Address First Name"] = shippingAddress.first_name
    result["Shipping Address Last Name"] = shippingAddress.last_name
    result["Shipping Address Company"] = shippingAddress.company
    result["Shipping Address Address 1"] = shippingAddress.address_1
    result["Shipping Address Address 2"] = shippingAddress.address_2
    result["Shipping Address City"] = shippingAddress.city
    result["Shipping Address Province"] = shippingAddress.province
    result["Shipping Address Postal Code"] = shippingAddress.postal_code
    result["Shipping Address Country Code"] = shippingAddress.country_code
    result["Shipping Address Phone"] = shippingAddress.phone
  }

  // Billing address
  const billingAddress = (order as any).billing_address
  if (billingAddress) {
    result["Billing Address First Name"] = billingAddress.first_name
    result["Billing Address Last Name"] = billingAddress.last_name
    result["Billing Address Company"] = billingAddress.company
    result["Billing Address Address 1"] = billingAddress.address_1
    result["Billing Address Address 2"] = billingAddress.address_2
    result["Billing Address City"] = billingAddress.city
    result["Billing Address Province"] = billingAddress.province
    result["Billing Address Postal Code"] = billingAddress.postal_code
    result["Billing Address Country Code"] = billingAddress.country_code
    result["Billing Address Phone"] = billingAddress.phone
  }

  // Sales channel
  const salesChannel = (order as any).sales_channel
  if (salesChannel) {
    result["Sales Channel Id"] = salesChannel.id
    result["Sales Channel Name"] = salesChannel.name
    result["Sales Channel Description"] = salesChannel.description
  }

  // Line items - flatten each item into numbered columns
  const items = (order as any).items || []
  items.forEach((item: any, idx: number) => {
    const prefix = `Item ${idx + 1}`
    result[`${prefix} Id`] = item.id
    result[`${prefix} Title`] = item.title
    result[`${prefix} Subtitle`] = item.subtitle
    result[`${prefix} Thumbnail`] = item.thumbnail
    result[`${prefix} Variant Id`] = item.variant_id
    result[`${prefix} Product Id`] = item.product_id
    result[`${prefix} Product Title`] = item.product_title
    result[`${prefix} Product Description`] = item.product_description
    result[`${prefix} Product Subtitle`] = item.product_subtitle
    result[`${prefix} Product Type`] = item.product_type
    result[`${prefix} Product Collection`] = item.product_collection
    result[`${prefix} Product Handle`] = item.product_handle
    result[`${prefix} Variant Sku`] = item.variant_sku
    result[`${prefix} Variant Barcode`] = item.variant_barcode
    result[`${prefix} Variant Title`] = item.variant_title
    result[`${prefix} Variant Option Values`] = item.variant_option_values
      ? JSON.stringify(item.variant_option_values)
      : ""
    result[`${prefix} Requires Shipping`] = item.requires_shipping
    result[`${prefix} Is Discountable`] = item.is_discountable
    result[`${prefix} Is Tax Inclusive`] = item.is_tax_inclusive
    result[`${prefix} Unit Price`] = item.unit_price
    result[`${prefix} Quantity`] = item.quantity
    result[`${prefix} Subtotal`] = item.subtotal
    result[`${prefix} Tax Total`] = item.tax_total
    result[`${prefix} Discount Total`] = item.discount_total
    result[`${prefix} Total`] = item.total
    result[`${prefix} Refundable Total`] = item.refundable_total
  })

  // Shipping methods
  const shippingMethods = (order as any).shipping_methods || []
  shippingMethods.forEach((method: any, idx: number) => {
    const prefix = `Shipping Method ${idx + 1}`
    result[`${prefix} Id`] = method.id
    result[`${prefix} Name`] = method.name
    result[`${prefix} Amount`] = method.amount
    result[`${prefix} Tax Total`] = method.tax_total
    result[`${prefix} Total`] = method.total
  })

  // Payment collections
  const paymentCollections = (order as any).payment_collections || []
  paymentCollections.forEach((collection: any, idx: number) => {
    const prefix = `Payment Collection ${idx + 1}`
    result[`${prefix} Id`] = collection.id
    result[`${prefix} Status`] = collection.status
    result[`${prefix} Amount`] = collection.amount
    result[`${prefix} Captured Amount`] = collection.captured_amount
    result[`${prefix} Refunded Amount`] = collection.refunded_amount
  })

  // Fulfillments
  const fulfillments = (order as any).fulfillments || []
  fulfillments.forEach((fulfillment: any, idx: number) => {
    const prefix = `Fulfillment ${idx + 1}`
    result[`${prefix} Id`] = fulfillment.id
    result[`${prefix} Provider Id`] = fulfillment.provider_id
    result[`${prefix} Packed At`] = fulfillment.packed_at
    result[`${prefix} Shipped At`] = fulfillment.shipped_at
    result[`${prefix} Delivered At`] = fulfillment.delivered_at
    result[`${prefix} Canceled At`] = fulfillment.canceled_at
  })

  return result
}
