import { GiftCardStatus } from "../../../loyalty"

/**
 * The gift card details in store context.
 */
export interface StoreGiftCard {
  /**
   * The ID of the gift card.
   */
  id: string
  /**
   * The unique code of the gift card.
   */
  code: string
  /**
   * The current balance of the gift card.
   */
  balance: number
  /**
   * The currency code of the gift card.
   */
  currency_code: string
  /**
   * The status of the gift card.
   */
  status: GiftCardStatus
  /**
   * The expiration date of the gift card.
   */
  expires_at: Date | null
}

/**
 * The store credit account details in store context.
 */
export interface StoreStoreCreditAccount {
  /**
   * The ID of the store credit account.
   */
  id: string
  /**
   * The currency code of the account.
   */
  currency_code: string
  /**
   * The current balance of the account.
   */
  balance: number
  /**
   * The ID of the customer who owns the account.
   */
  customer_id: string | null
}
