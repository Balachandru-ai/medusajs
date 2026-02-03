import { FindConfig } from "../common"
import { RestoreReturn, SoftDeleteReturn } from "../dal"
import { IModuleService } from "../modules-sdk"
import { Context } from "../shared-context"
import {
  AccountStatsDTO,
  AccountTransactionDTO,
  FilterableAccountTransactionProps,
  FilterableGiftCardProps,
  FilterableStoreCreditAccountProps,
  GiftCardDTO,
  StoreCreditAccountDTO,
} from "./common"
import {
  CreateGiftCardDTO,
  CreateStoreCreditAccountDTO,
  CreditAccountDTO,
  DebitAccountDTO,
  UpdateGiftCardDTO,
  UpdateStoreCreditAccountDTO,
} from "./mutations"

/**
 * The main service interface for the Loyalty Module.
 */
export interface ILoyaltyModuleService extends IModuleService {
  // ==========================================
  // Gift Card Methods
  // ==========================================

  /**
   * Creates gift cards.
   *
   * @param data - The gift cards to be created.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created gift cards.
   *
   * @example
   * const giftCards = await loyaltyModuleService.createGiftCards([
   *   {
   *     value: 100,
   *     currency_code: "usd",
   *   },
   * ])
   */
  createGiftCards(
    data: CreateGiftCardDTO[],
    sharedContext?: Context
  ): Promise<GiftCardDTO[]>

  /**
   * Creates a gift card.
   *
   * @param data - The gift card to be created.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created gift card.
   *
   * @example
   * const giftCard = await loyaltyModuleService.createGiftCards({
   *   value: 100,
   *   currency_code: "usd",
   * })
   */
  createGiftCards(
    data: CreateGiftCardDTO,
    sharedContext?: Context
  ): Promise<GiftCardDTO>

  /**
   * Updates existing gift cards.
   *
   * @param data - The attributes to update in the gift cards.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated gift cards.
   *
   * @example
   * const giftCards = await loyaltyModuleService.updateGiftCards([
   *   {
   *     id: "gcard_123",
   *     status: "active",
   *   },
   * ])
   */
  updateGiftCards(
    data: UpdateGiftCardDTO[],
    sharedContext?: Context
  ): Promise<GiftCardDTO[]>

  /**
   * Updates an existing gift card.
   *
   * @param data - The attributes to update in the gift card.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated gift card.
   *
   * @example
   * const giftCard = await loyaltyModuleService.updateGiftCards({
   *   id: "gcard_123",
   *   status: "active",
   * })
   */
  updateGiftCards(
    data: UpdateGiftCardDTO,
    sharedContext?: Context
  ): Promise<GiftCardDTO>

  /**
   * Retrieves a paginated list of gift cards based on optional filters and configuration.
   *
   * @param filters - The filters to apply on the retrieved gift cards.
   * @param config - The configurations determining how the gift card is retrieved.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of gift cards.
   *
   * @example
   * const giftCards = await loyaltyModuleService.listGiftCards({
   *   status: "active",
   *   currency_code: "usd",
   * })
   */
  listGiftCards(
    filters?: FilterableGiftCardProps,
    config?: FindConfig<GiftCardDTO>,
    sharedContext?: Context
  ): Promise<GiftCardDTO[]>

  /**
   * Retrieves a paginated list of gift cards along with the total count of available gift cards satisfying the provided filters.
   *
   * @param filters - The filters to apply on the retrieved gift cards.
   * @param config - The configurations determining how the gift card is retrieved.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of gift cards along with their total count.
   *
   * @example
   * const [giftCards, count] = await loyaltyModuleService.listAndCountGiftCards({
   *   status: "active",
   * })
   */
  listAndCountGiftCards(
    filters?: FilterableGiftCardProps,
    config?: FindConfig<GiftCardDTO>,
    sharedContext?: Context
  ): Promise<[GiftCardDTO[], number]>

  /**
   * Retrieves a gift card by its ID.
   *
   * @param id - The ID of the gift card.
   * @param config - The configurations determining how the gift card is retrieved.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The retrieved gift card.
   *
   * @example
   * const giftCard = await loyaltyModuleService.retrieveGiftCard("gcard_123")
   */
  retrieveGiftCard(
    id: string,
    config?: FindConfig<GiftCardDTO>,
    sharedContext?: Context
  ): Promise<GiftCardDTO>

  /**
   * Deletes gift cards by their IDs.
   *
   * @param ids - The IDs of the gift cards.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns Resolves when the gift cards are deleted.
   *
   * @example
   * await loyaltyModuleService.deleteGiftCards(["gcard_123", "gcard_456"])
   */
  deleteGiftCards(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * Soft deletes gift cards by their IDs.
   *
   * @param giftCardIds - The IDs of the gift cards to soft delete.
   * @param config - An object that specifies related entities to soft-delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns An object with the IDs of related records that were also soft deleted.
   *
   * @example
   * await loyaltyModuleService.softDeleteGiftCards(["gcard_123"])
   */
  softDeleteGiftCards<TReturnableLinkableKeys extends string = string>(
    giftCardIds: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  /**
   * Restores soft deleted gift cards by their IDs.
   *
   * @param giftCardIds - The IDs of the gift cards to restore.
   * @param config - Configurations determining which relations to restore.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns An object with the IDs of related records that were restored.
   *
   * @example
   * await loyaltyModuleService.restoreGiftCards(["gcard_123"])
   */
  restoreGiftCards<TReturnableLinkableKeys extends string = string>(
    giftCardIds: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  // ==========================================
  // Store Credit Account Methods
  // ==========================================

  /**
   * Creates store credit accounts.
   *
   * @param data - The store credit accounts to be created.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created store credit accounts.
   *
   * @example
   * const accounts = await loyaltyModuleService.createStoreCreditAccounts([
   *   {
   *     currency_code: "usd",
   *     customer_id: "cus_123",
   *   },
   * ])
   */
  createStoreCreditAccounts(
    data: CreateStoreCreditAccountDTO[],
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO[]>

  /**
   * Creates a store credit account.
   *
   * @param data - The store credit account to be created.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created store credit account.
   *
   * @example
   * const account = await loyaltyModuleService.createStoreCreditAccounts({
   *   currency_code: "usd",
   *   customer_id: "cus_123",
   * })
   */
  createStoreCreditAccounts(
    data: CreateStoreCreditAccountDTO,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO>

  /**
   * Updates existing store credit accounts.
   *
   * @param data - The attributes to update in the store credit accounts.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated store credit accounts.
   *
   * @example
   * const accounts = await loyaltyModuleService.updateStoreCreditAccounts([
   *   {
   *     id: "sc_acc_123",
   *     metadata: { vip: true },
   *   },
   * ])
   */
  updateStoreCreditAccounts(
    data: UpdateStoreCreditAccountDTO[],
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO[]>

  /**
   * Updates an existing store credit account.
   *
   * @param data - The attributes to update in the store credit account.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The updated store credit account.
   *
   * @example
   * const account = await loyaltyModuleService.updateStoreCreditAccounts({
   *   id: "sc_acc_123",
   *   metadata: { vip: true },
   * })
   */
  updateStoreCreditAccounts(
    data: UpdateStoreCreditAccountDTO,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO>

  /**
   * Retrieves a paginated list of store credit accounts based on optional filters and configuration.
   *
   * @param filters - The filters to apply on the retrieved store credit accounts.
   * @param config - The configurations determining how the store credit account is retrieved.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of store credit accounts.
   *
   * @example
   * const accounts = await loyaltyModuleService.listStoreCreditAccounts({
   *   customer_id: "cus_123",
   * })
   */
  listStoreCreditAccounts(
    filters?: FilterableStoreCreditAccountProps,
    config?: FindConfig<StoreCreditAccountDTO>,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO[]>

  /**
   * Retrieves a paginated list of store credit accounts along with the total count.
   *
   * @param filters - The filters to apply on the retrieved store credit accounts.
   * @param config - The configurations determining how the store credit account is retrieved.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of store credit accounts along with their total count.
   *
   * @example
   * const [accounts, count] = await loyaltyModuleService.listAndCountStoreCreditAccounts({
   *   customer_id: "cus_123",
   * })
   */
  listAndCountStoreCreditAccounts(
    filters?: FilterableStoreCreditAccountProps,
    config?: FindConfig<StoreCreditAccountDTO>,
    sharedContext?: Context
  ): Promise<[StoreCreditAccountDTO[], number]>

  /**
   * Retrieves a store credit account by its ID.
   *
   * @param id - The ID of the store credit account.
   * @param config - The configurations determining how the store credit account is retrieved.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The retrieved store credit account.
   *
   * @example
   * const account = await loyaltyModuleService.retrieveStoreCreditAccount("sc_acc_123")
   */
  retrieveStoreCreditAccount(
    id: string,
    config?: FindConfig<StoreCreditAccountDTO>,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO>

  /**
   * Deletes store credit accounts by their IDs.
   *
   * @param ids - The IDs of the store credit accounts.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns Resolves when the store credit accounts are deleted.
   *
   * @example
   * await loyaltyModuleService.deleteStoreCreditAccounts(["sc_acc_123"])
   */
  deleteStoreCreditAccounts(ids: string[], sharedContext?: Context): Promise<void>

  /**
   * Soft deletes store credit accounts by their IDs.
   *
   * @param accountIds - The IDs of the store credit accounts to soft delete.
   * @param config - An object that specifies related entities to soft-delete.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns An object with the IDs of related records that were also soft deleted.
   *
   * @example
   * await loyaltyModuleService.softDeleteStoreCreditAccounts(["sc_acc_123"])
   */
  softDeleteStoreCreditAccounts<TReturnableLinkableKeys extends string = string>(
    accountIds: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  /**
   * Restores soft deleted store credit accounts by their IDs.
   *
   * @param accountIds - The IDs of the store credit accounts to restore.
   * @param config - Configurations determining which relations to restore.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns An object with the IDs of related records that were restored.
   *
   * @example
   * await loyaltyModuleService.restoreStoreCreditAccounts(["sc_acc_123"])
   */
  restoreStoreCreditAccounts<TReturnableLinkableKeys extends string = string>(
    accountIds: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  // ==========================================
  // Transaction Methods
  // ==========================================

  /**
   * Retrieves a paginated list of account transactions based on optional filters and configuration.
   *
   * @param filters - The filters to apply on the retrieved transactions.
   * @param config - The configurations determining how the transaction is retrieved.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The list of transactions.
   *
   * @example
   * const transactions = await loyaltyModuleService.listAccountTransactions({
   *   account_id: "sc_acc_123",
   * })
   */
  listAccountTransactions(
    filters: FilterableAccountTransactionProps,
    config?: FindConfig<AccountTransactionDTO>,
    sharedContext?: Context
  ): Promise<AccountTransactionDTO[]>

  /**
   * Retrieves the statistics for a store credit account.
   *
   * @param data - The data containing the account ID.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The account statistics.
   *
   * @example
   * const stats = await loyaltyModuleService.retrieveAccountStats({
   *   account_id: "sc_acc_123",
   * })
   */
  retrieveAccountStats(
    data: { account_id: string },
    sharedContext?: Context
  ): Promise<AccountStatsDTO>

  /**
   * Credits store credit accounts.
   *
   * @param data - The credit data.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created transactions.
   *
   * @example
   * const transactions = await loyaltyModuleService.creditAccounts([
   *   {
   *     account_id: "sc_acc_123",
   *     amount: 50,
   *     reference: "order",
   *     reference_id: "order_123",
   *   },
   * ])
   */
  creditAccounts(
    data: CreditAccountDTO[],
    sharedContext?: Context
  ): Promise<AccountTransactionDTO[]>

  /**
   * Debits store credit accounts.
   *
   * @param data - The debit data.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns The created transactions.
   *
   * @example
   * const transactions = await loyaltyModuleService.debitAccounts([
   *   {
   *     account_id: "sc_acc_123",
   *     amount: 25,
   *     reference: "order",
   *     reference_id: "order_456",
   *   },
   * ])
   */
  debitAccounts(
    data: DebitAccountDTO[],
    sharedContext?: Context
  ): Promise<AccountTransactionDTO[]>

  /**
   * Deletes account transactions by their IDs.
   *
   * @param ids - The IDs of the transactions.
   * @param sharedContext - A context used to share resources, such as transaction manager, between the application and the module.
   * @returns Resolves when the transactions are deleted.
   *
   * @example
   * await loyaltyModuleService.deleteAccountTransactions(["sc_trx_123"])
   */
  deleteAccountTransactions(ids: string[], sharedContext?: Context): Promise<void>
}
