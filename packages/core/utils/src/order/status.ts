/**
 * @enum
 *
 * The order's status.
 */
export enum OrderStatus {
  /**
   * The order is pending.
   */
  PENDING = "pending",
  /**
   * The order is completed
   */
  COMPLETED = "completed",
  /**
   * The order is a draft.
   */
  DRAFT = "draft",
  /**
   * The order is archived.
   */
  ARCHIVED = "archived",
  /**
   * The order is canceled.
   */
  CANCELED = "canceled",
  /**
   * The order requires action.
   */
  REQUIRES_ACTION = "requires_action",
}

/**
 * @enum
 *
 * The return's status.
 */
export enum ReturnStatus {
  /**
   * The return is open.
   */
  OPEN = "open",
  /**
   * The return is requested.
   */
  REQUESTED = "requested",
  /**
   * The return is received.
   */
  RECEIVED = "received",
  /**
   * The return is partially received.
   */
  PARTIALLY_RECEIVED = "partially_received",
  /**
   * The return is canceled.
   */
  CANCELED = "canceled",
}

/**
 * @enum
 *
 * The claim's type.
 */
export enum ClaimType {
  /**
   * The claim refunds an amount to the customer.
   */
  REFUND = "refund",
  /**
   * The claim replaces the returned item with a new one.
   */
  REPLACE = "replace",
}

/**
 * @enum
 *
 * The claim's item reason.
 */
export enum ClaimReason {
  MISSING_ITEM = "missing_item",
  WRONG_ITEM = "wrong_item",
  PRODUCTION_FAILURE = "production_failure",
  OTHER = "other",
}

/**
 * @enum
 *
 * The order's payment status.
 */
export enum PaymentStatus {
  /**
   * The order is not paid.
   */
  NOT_PAID = "not_paid",
  /**
   * The order payment is awaiting.
   */
  AWAITING = "awaiting",
  /**
   * The order payment is captured.
   */
  CAPTURED = "captured",
  /**
   * The order payment is partially captured.
   */
  PARTIALLY_CAPTURED = "partially_captured",
  /**
   * The order payment is partially refunded.
   */
  PARTIALLY_REFUNDED = "partially_refunded",
  /**
   * The order payment is refunded.
   */
  REFUNDED = "refunded",
  /**
   * The order payment is canceled.
   */
  CANCELED = "canceled",
  /**
   * The order payment requires action.
   */
  REQUIRES_ACTION = "requires_action",
  /**
   * The order payment is authorized.
   */
  AUTHORIZED = "authorized",
  /**
   * The order payment is partially authorized.
   */
  PARTIALLY_AUTHORIZED = "partially_authorized",
}

/**
 * @enum
 *
 * The order's fulfillment status.
 */
export enum FulfillmentStatus {
  /**
   * The order is not fulfilled.
   */
  NOT_FULFILLED = "not_fulfilled",
  /**
   * The order is partially fulfilled.
   */
  PARTIALLY_FULFILLED = "partially_fulfilled",
  /**
   * The order is fulfilled.
   */
  FULFILLED = "fulfilled",
  /**
   * The order is partially shipped.
   */
  PARTIALLY_SHIPPED = "partially_shipped",
  /**
   * The order is shipped.
   */
  SHIPPED = "shipped",
  /**
   * The order is delivered.
   */
  DELIVERED = "delivered",
  /**
   * The order is partially delivered.
   */
  PARTIALLY_DELIVERED = "partially_delivered",
  /**
   * The order fulfillment is canceled.
   */
  CANCELED = "canceled",
}
