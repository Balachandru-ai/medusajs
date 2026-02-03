import { PaginatedResponse } from "../../common"
import { StoreGiftCard, StoreStoreCreditAccount } from "./entities"

/**
 * The response for a single gift card.
 */
export interface StoreGiftCardResponse {
  /**
   * The gift card details.
   */
  gift_card: StoreGiftCard
}

/**
 * The response for a single store credit account.
 */
export interface StoreStoreCreditAccountResponse {
  /**
   * The store credit account details.
   */
  store_credit_account: StoreStoreCreditAccount
}

/**
 * The response for listing store credit accounts.
 */
export type StoreStoreCreditAccountListResponse = PaginatedResponse<{
  /**
   * The list of store credit accounts.
   */
  store_credit_accounts: StoreStoreCreditAccount[]
}>
