import { BaseFilterable, OperatorMap } from "../dal"
import { BigNumberValue } from "../totals"

export enum GiftCardStatus {
  PENDING = "pending",
  ACTIVE = "active",
  REDEEMED = "redeemed",
  DISABLED = "disabled",
  EXPIRED = "expired",
}

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
}

/**
 * The gift card details.
 */
export interface GiftCardDTO {
  /**
   * The ID of the gift card.
   */
  id: string
  /**
   * The status of the gift card.
   */
  status: GiftCardStatus
  /**
   * The original value of the gift card.
   */
  value: BigNumberValue
  /**
   * The current balance of the gift card.
   */
  balance: BigNumberValue
  /**
   * The unique code of the gift card.
   */
  code: string
  /**
   * The currency code of the gift card.
   */
  currency_code: string
  /**
   * The expiration date of the gift card.
   */
  expires_at: Date | null
  /**
   * The reference ID for the gift card (e.g., order ID).
   */
  reference_id: string | null
  /**
   * The reference type for the gift card (e.g., "order").
   */
  reference: string | null
  /**
   * The ID of the line item that created this gift card.
   */
  line_item_id: string | null
  /**
   * An optional note for the gift card.
   */
  note: string | null
  /**
   * Custom metadata for the gift card.
   */
  metadata: Record<string, unknown> | null
  /**
   * When the gift card was created.
   */
  created_at: Date
  /**
   * When the gift card was updated.
   */
  updated_at: Date
  /**
   * When the gift card was deleted.
   */
  deleted_at: Date | null
}

/**
 * The filters to apply on the gift card.
 */
export interface FilterableGiftCardProps
  extends BaseFilterable<FilterableGiftCardProps> {
  /**
   * Search query for gift cards.
   */
  q?: string
  /**
   * Filter by gift card ID(s).
   */
  id?: string | string[] | OperatorMap<string | string[]>
  /**
   * Filter by gift card code(s).
   */
  code?: string | string[] | OperatorMap<string | string[]>
  /**
   * Filter by reference ID(s).
   */
  reference_id?: string | string[] | OperatorMap<string | string[]>
  /**
   * Filter by reference type(s).
   */
  reference?: string | string[] | OperatorMap<string | string[]>
  /**
   * Filter by status(es).
   */
  status?:
    | GiftCardStatus
    | GiftCardStatus[]
    | OperatorMap<GiftCardStatus | GiftCardStatus[]>
  /**
   * Filter by currency code(s).
   */
  currency_code?: string | string[] | OperatorMap<string | string[]>
}

/**
 * The store credit account details.
 */
export interface StoreCreditAccountDTO {
  /**
   * The ID of the store credit account.
   */
  id: string
  /**
   * The unique code for claiming the account.
   */
  code: string | null
  /**
   * The currency code of the account.
   */
  currency_code: string
  /**
   * The ID of the customer who owns the account.
   */
  customer_id: string | null
  /**
   * The current balance of the account.
   */
  balance: number
  /**
   * The total credits added to the account.
   */
  credits: number
  /**
   * The total debits from the account.
   */
  debits: number
  /**
   * Custom metadata for the account.
   */
  metadata: Record<string, unknown> | null
  /**
   * The transactions for the account.
   */
  transactions?: AccountTransactionDTO[]
  /**
   * When the account was created.
   */
  created_at: Date
  /**
   * When the account was updated.
   */
  updated_at: Date
  /**
   * When the account was deleted.
   */
  deleted_at: Date | null
}

/**
 * The filters to apply on the store credit account.
 */
export interface FilterableStoreCreditAccountProps
  extends BaseFilterable<FilterableStoreCreditAccountProps> {
  /**
   * Search query for store credit accounts.
   */
  q?: string
  /**
   * Filter by account ID(s).
   */
  id?: string | string[] | OperatorMap<string | string[]>
  /**
   * Filter by currency code(s).
   */
  currency_code?: string | string[] | OperatorMap<string | string[]>
  /**
   * Filter by customer ID(s).
   */
  customer_id?: string | string[] | OperatorMap<string | string[]>
}

/**
 * The account transaction details.
 */
export interface AccountTransactionDTO {
  /**
   * The ID of the transaction.
   */
  id: string
  /**
   * The amount of the transaction.
   */
  amount: BigNumberValue
  /**
   * The type of transaction (credit or debit).
   */
  type: TransactionType
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
  note: string | null
  /**
   * The ID of the account this transaction belongs to.
   */
  account_id: string
  /**
   * Custom metadata for the transaction.
   */
  metadata: Record<string, unknown> | null
  /**
   * When the transaction was created.
   */
  created_at: Date
  /**
   * When the transaction was updated.
   */
  updated_at: Date
}

/**
 * The filters to apply on the account transaction.
 */
export interface FilterableAccountTransactionProps
  extends BaseFilterable<FilterableAccountTransactionProps> {
  /**
   * Filter by transaction ID(s).
   */
  id?: string | string[] | OperatorMap<string | string[]>
  /**
   * Filter by account ID(s).
   */
  account_id?: string | string[] | OperatorMap<string | string[]>
}

/**
 * The account statistics.
 */
export interface AccountStatsDTO {
  /**
   * The ID of the account.
   */
  id: string
  /**
   * The current balance of the account.
   */
  balance: number
  /**
   * The total credits added to the account.
   */
  credits: number
  /**
   * The total debits from the account.
   */
  debits: number
}
