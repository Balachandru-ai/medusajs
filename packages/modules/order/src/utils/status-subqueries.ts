/**
 * Builds a SQL CASE expression that calculates the payment_status for an order
 * based on its linked payment_collections.
 * 
 * The logic mirrors getLastPaymentStatus from core-flows/order/utils/aggregate-status.ts
 * It counts payment_collections by their status field and applies the same hierarchy
 */
export function buildPaymentStatusCaseExpression(
  knex: any,
  orderAlias: string = "o"
) {
  return knex.raw(`
    CASE
      -- requires_action: any payment collection has requires_action status
      WHEN EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status = 'requires_action'
      ) THEN 'requires_action'
      
      -- For refunded/captured/authorized, we need to check if the count of that status equals total non-canceled
      -- captured: all non-canceled payment collections have captured status (completed in DB)
      WHEN EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status = 'completed'
      ) AND NOT EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status != 'canceled'
          AND pc.status != 'completed'
      ) THEN 'captured'
      
      -- partially_captured: some completed but not all
      WHEN EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status = 'completed'
      ) THEN 'partially_captured'
      
      -- authorized: all non-canceled payments are authorized
      WHEN EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status = 'authorized'
      ) AND NOT EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status != 'canceled' 
          AND pc.status != 'authorized'
      ) THEN 'authorized'
      
      -- partially_authorized: some authorized but not all
      WHEN EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status = 'authorized'
      ) THEN 'partially_authorized'
      
      -- canceled: all payments are canceled
      WHEN EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id
          AND pc.deleted_at IS NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status != 'canceled'
      ) THEN 'canceled'
      
      -- awaiting: has awaiting payments
      WHEN EXISTS (
        SELECT 1 FROM order_payment_collection opc
        JOIN payment_collection pc ON pc.id = opc.payment_collection_id
        WHERE opc.order_id = ${orderAlias}.id 
          AND pc.deleted_at IS NULL
          AND pc.status = 'awaiting'
      ) THEN 'awaiting'
      
      -- not_paid: default
      ELSE 'not_paid'
    END
  `)
}

/**
 * Builds a SQL CASE expression that calculates the fulfillment_status for an order
 * based on its linked fulfillments and item fulfillment quantities.
 * 
 * The logic mirrors getLastFulfillmentStatus from core-flows/order/utils/aggregate-status.ts
 */
export function buildFulfillmentStatusCaseExpression(
  knex: any,
  orderAlias: string = "o"
) {
  return knex.raw(`
    CASE
      -- delivered: all fulfillments delivered and no unfulfilled items
      WHEN EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.delivered_at IS NOT NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.canceled_at IS NULL 
          AND f.delivered_at IS NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_item oi
        WHERE oi.order_id = ${orderAlias}.id
          AND oi.version = ${orderAlias}.version
          AND (oi.raw_quantity->>'value')::numeric > COALESCE((oi.raw_fulfilled_quantity->>'value')::numeric, 0)
      ) THEN 'delivered'
      
      -- partially_delivered: some delivered but not all
      WHEN EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.delivered_at IS NOT NULL
      ) THEN 'partially_delivered'
      
      -- shipped: all fulfillments shipped and no unfulfilled items
      WHEN EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.shipped_at IS NOT NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.canceled_at IS NULL 
          AND f.shipped_at IS NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_item oi
        WHERE oi.order_id = ${orderAlias}.id
          AND oi.version = ${orderAlias}.version
          AND (oi.raw_quantity->>'value')::numeric > COALESCE((oi.raw_fulfilled_quantity->>'value')::numeric, 0)
      ) THEN 'shipped'
      
      -- partially_shipped: some shipped but not all
      WHEN EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.shipped_at IS NOT NULL
      ) THEN 'partially_shipped'
      
      -- fulfilled: all fulfillments packed and no unfulfilled items
      WHEN EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.packed_at IS NOT NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.canceled_at IS NULL 
          AND f.packed_at IS NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_item oi
        WHERE oi.order_id = ${orderAlias}.id
          AND oi.version = ${orderAlias}.version
          AND (oi.raw_quantity->>'value')::numeric > COALESCE((oi.raw_fulfilled_quantity->>'value')::numeric, 0)
      ) THEN 'fulfilled'
      
      -- partially_fulfilled: some packed but not all
      WHEN EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.packed_at IS NOT NULL
      ) THEN 'partially_fulfilled'
      
      -- canceled: all fulfillments canceled
      WHEN EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id
          AND f.deleted_at IS NULL
      ) AND NOT EXISTS (
        SELECT 1 FROM order_fulfillment of_link
        JOIN fulfillment f ON f.id = of_link.fulfillment_id
        WHERE of_link.order_id = ${orderAlias}.id 
          AND f.deleted_at IS NULL
          AND f.canceled_at IS NULL
      ) THEN 'canceled'
      
      -- not_fulfilled: default
      ELSE 'not_fulfilled'
    END
  `)
}

