/**
 * The data to add a gift card to a cart.
 */
export interface StoreAddGiftCardToCart {
  /**
   * The gift card code to add.
   */
  code: string
}

/**
 * The data to apply store credits to a cart.
 */
export interface StoreApplyStoreCredits {
  /**
   * The amount to apply. If not provided, the maximum available balance will be used.
   */
  amount?: number
}

/**
 * The data to claim a store credit account.
 */
export interface StoreClaimStoreCreditAccount {
  /**
   * The code to claim the account with.
   */
  code: string
}
