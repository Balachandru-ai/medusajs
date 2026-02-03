import { BaseFilterable, OperatorMap } from "../../../dal"
import { GiftCardStatus } from "../../../loyalty"
import { FindParams, SelectParams } from "../../common"

/**
 * The params for retrieving a single gift card.
 */
export interface AdminGetGiftCardParams extends SelectParams {}

/**
 * The params for listing gift cards.
 */
export interface AdminGetGiftCardsParams
  extends FindParams,
    BaseFilterable<AdminGetGiftCardsParams> {
  /**
   * Search for a gift card by its code.
   */
  q?: string
  /**
   * Filter by gift card ID(s).
   */
  id?: string | string[]
  /**
   * Filter by gift card code(s).
   */
  code?: string | string[]
  /**
   * Filter by status(es).
   */
  status?: GiftCardStatus | GiftCardStatus[]
  /**
   * Filter by currency code(s).
   */
  currency_code?: string | string[]
  /**
   * Filter by created date.
   */
  created_at?: OperatorMap<string>
  /**
   * Filter by updated date.
   */
  updated_at?: OperatorMap<string>
}

/**
 * The params for retrieving a single store credit account.
 */
export interface AdminGetStoreCreditAccountParams extends SelectParams {}

/**
 * The params for listing store credit accounts.
 */
export interface AdminGetStoreCreditAccountsParams
  extends FindParams,
    BaseFilterable<AdminGetStoreCreditAccountsParams> {
  /**
   * Search for a store credit account.
   */
  q?: string
  /**
   * Filter by account ID(s).
   */
  id?: string | string[]
  /**
   * Filter by currency code(s).
   */
  currency_code?: string | string[]
  /**
   * Filter by customer ID(s).
   */
  customer_id?: string | string[]
  /**
   * Filter by created date.
   */
  created_at?: OperatorMap<string>
  /**
   * Filter by updated date.
   */
  updated_at?: OperatorMap<string>
}

/**
 * The params for listing account transactions.
 */
export interface AdminGetAccountTransactionsParams
  extends FindParams,
    BaseFilterable<AdminGetAccountTransactionsParams> {
  /**
   * Filter by transaction ID(s).
   */
  id?: string | string[]
  /**
   * Filter by account ID(s).
   */
  account_id?: string | string[]
  /**
   * Filter by created date.
   */
  created_at?: OperatorMap<string>
}
