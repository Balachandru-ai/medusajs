import {
  GiftCardDTO,
  StoreCreditAccountDTO,
  AccountTransactionDTO,
} from "../../../loyalty"

/**
 * The gift card details in admin context.
 */
export interface AdminGiftCard extends Omit<GiftCardDTO, "deleted_at"> {}

/**
 * The store credit account details in admin context.
 */
export interface AdminStoreCreditAccount
  extends Omit<StoreCreditAccountDTO, "deleted_at"> {
  /**
   * The transactions for the account.
   */
  transactions?: AdminAccountTransaction[]
}

/**
 * The account transaction details in admin context.
 */
export interface AdminAccountTransaction extends AccountTransactionDTO {}
