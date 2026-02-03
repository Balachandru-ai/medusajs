import { GiftCardStatus } from "../../../loyalty"

/**
 * The data to create a gift card.
 */
export interface AdminCreateGiftCard {
  /**
   * The value of the gift card.
   */
  value: number
  /**
   * The currency code of the gift card.
   */
  currency_code: string
  /**
   * The unique code of the gift card. If not provided, one will be generated.
   */
  code?: string
  /**
   * The status of the gift card.
   */
  status?: GiftCardStatus
  /**
   * The expiration date of the gift card.
   */
  expires_at?: string | null
  /**
   * The reference ID for the gift card (e.g., order ID).
   */
  reference_id?: string | null
  /**
   * The reference type for the gift card (e.g., "order").
   */
  reference?: string | null
  /**
   * An optional note for the gift card.
   */
  note?: string | null
  /**
   * Custom metadata for the gift card.
   */
  metadata?: Record<string, unknown>
}

/**
 * The data to update a gift card.
 */
export interface AdminUpdateGiftCard {
  /**
   * The status of the gift card.
   */
  status?: GiftCardStatus
  /**
   * The value of the gift card.
   */
  value?: number
  /**
   * The expiration date of the gift card.
   */
  expires_at?: string | null
  /**
   * An optional note for the gift card.
   */
  note?: string | null
  /**
   * Custom metadata for the gift card.
   */
  metadata?: Record<string, unknown>
}

/**
 * The data to create a store credit account.
 */
export interface AdminCreateStoreCreditAccount {
  /**
   * The currency code of the account.
   */
  currency_code: string
  /**
   * The ID of the customer who owns the account.
   */
  customer_id?: string | null
  /**
   * The unique code for claiming the account.
   */
  code?: string | null
  /**
   * Custom metadata for the account.
   */
  metadata?: Record<string, unknown>
}

/**
 * The data to credit a store credit account.
 */
export interface AdminCreditStoreCreditAccount {
  /**
   * The amount to credit.
   */
  amount: number
  /**
   * The reference type for the transaction.
   */
  reference: string
  /**
   * The reference ID for the transaction.
   */
  reference_id: string
  /**
   * An optional note for the transaction.
   */
  note?: string | null
}
