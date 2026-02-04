import { BigNumberValue } from "../totals"
import { GiftCardStatus } from "./common"

/**
 * The data to create a gift card.
 */
export interface CreateGiftCardDTO {
  /**
   * The value of the gift card.
   */
  value: BigNumberValue
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
  expires_at?: Date | null
  /**
   * The reference ID for the gift card (e.g., order ID).
   */
  reference_id?: string | null
  /**
   * The reference type for the gift card (e.g., "order").
   */
  reference?: string | null
  /**
   * The ID of the line item that created this gift card.
   */
  line_item_id?: string | null
  /**
   * An optional note for the gift card.
   */
  note?: string | null
  /**
   * Custom metadata for the gift card.
   */
  metadata?: Record<string, unknown> | null
}

/**
 * The data to update a gift card.
 */
export interface UpdateGiftCardDTO {
  /**
   * The ID of the gift card to update.
   */
  id: string
  /**
   * The status of the gift card.
   */
  status?: GiftCardStatus
  /**
   * The value of the gift card.
   */
  value?: BigNumberValue
  /**
   * The expiration date of the gift card.
   */
  expires_at?: Date | null
  /**
   * An optional note for the gift card.
   */
  note?: string | null
  /**
   * Custom metadata for the gift card.
   */
  metadata?: Record<string, unknown> | null
  /**
   * The ID of the linked store credit account.
   */
  store_credit_account_id?: string | null
}

/**
 * The data to create a store credit account.
 */
export interface CreateStoreCreditAccountDTO {
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
  metadata?: Record<string, unknown> | null
}

/**
 * The data to update a store credit account.
 */
export interface UpdateStoreCreditAccountDTO {
  /**
   * The ID of the account to update.
   */
  id: string
  /**
   * Custom metadata for the account.
   */
  metadata?: Record<string, unknown> | null
}

/**
 * The data to credit a store credit account.
 */
export interface CreditAccountDTO {
  /**
   * The ID of the account to credit.
   */
  account_id: string
  /**
   * The amount to credit.
   */
  amount: BigNumberValue
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

/**
 * The data to debit a store credit account.
 */
export interface DebitAccountDTO {
  /**
   * The ID of the account to debit.
   */
  account_id: string
  /**
   * The amount to debit.
   */
  amount: BigNumberValue
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
