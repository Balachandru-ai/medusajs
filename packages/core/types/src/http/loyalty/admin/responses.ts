import { DeleteResponse, PaginatedResponse } from "../../common"
import {
  AdminGiftCard,
  AdminStoreCreditAccount,
  AdminAccountTransaction,
} from "./entities"

/**
 * The response for a single gift card.
 */
export interface AdminGiftCardResponse {
  /**
   * The gift card details.
   */
  gift_card: AdminGiftCard
}

/**
 * The response for listing gift cards.
 */
export type AdminGiftCardListResponse = PaginatedResponse<{
  /**
   * The list of gift cards.
   */
  gift_cards: AdminGiftCard[]
}>

/**
 * The response for deleting a gift card.
 */
export type AdminGiftCardDeleteResponse = DeleteResponse<"gift_card">

/**
 * The response for a single store credit account.
 */
export interface AdminStoreCreditAccountResponse {
  /**
   * The store credit account details.
   */
  store_credit_account: AdminStoreCreditAccount
}

/**
 * The response for listing store credit accounts.
 */
export type AdminStoreCreditAccountListResponse = PaginatedResponse<{
  /**
   * The list of store credit accounts.
   */
  store_credit_accounts: AdminStoreCreditAccount[]
}>

/**
 * The response for deleting a store credit account.
 */
export type AdminStoreCreditAccountDeleteResponse =
  DeleteResponse<"store_credit_account">

/**
 * The response for listing account transactions.
 */
export type AdminAccountTransactionListResponse = PaginatedResponse<{
  /**
   * The list of transactions.
   */
  transactions: AdminAccountTransaction[]
}>
