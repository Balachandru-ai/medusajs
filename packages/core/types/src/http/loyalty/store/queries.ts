import { FindParams, SelectParams } from "../../common"

/**
 * The params for retrieving a single gift card.
 */
export interface StoreGetGiftCardParams extends SelectParams {}

/**
 * The params for listing store credit accounts.
 */
export interface StoreGetStoreCreditAccountsParams extends FindParams {
  /**
   * Filter by currency code.
   */
  currency_code?: string
}
