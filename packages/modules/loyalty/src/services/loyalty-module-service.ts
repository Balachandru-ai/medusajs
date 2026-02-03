import {
  Context,
  DAL,
  FindConfig,
  InferEntityType,
  LoyaltyTypes,
  ModulesSdkTypes,
  SoftDeleteReturn,
} from "@medusajs/framework/types"
import {
  InjectManager,
  InjectTransactionManager,
  isDefined,
  MathBN,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { GiftCard, StoreCreditAccount, AccountTransaction } from "@models"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  accountTransactionService: ModulesSdkTypes.IMedusaInternalService<any>
  giftCardService: ModulesSdkTypes.IMedusaInternalService<any>
}

export class LoyaltyModuleService
  extends MedusaService<{
    GiftCard: { dto: LoyaltyTypes.GiftCardDTO }
    StoreCreditAccount: { dto: LoyaltyTypes.StoreCreditAccountDTO }
    AccountTransaction: { dto: LoyaltyTypes.AccountTransactionDTO }
  }>({ GiftCard, StoreCreditAccount, AccountTransaction })
  implements LoyaltyTypes.ILoyaltyModuleService
{
  protected baseRepository_: DAL.RepositoryService
  protected readonly accountTransactionService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof AccountTransaction>
  >
  protected readonly giftCardService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof GiftCard>
  >

  constructor({
    baseRepository,
    accountTransactionService,
    giftCardService,
  }: InjectedDependencies) {
    // @ts-ignore
    super(...arguments)

    this.baseRepository_ = baseRepository
    this.accountTransactionService_ = accountTransactionService
    this.giftCardService_ = giftCardService
  }

  // ==========================================
  // Store Credit Account Methods
  // ==========================================

  @InjectManager()
  // @ts-expect-error - overriding parent method
  async listStoreCreditAccounts(
    filters: LoyaltyTypes.FilterableStoreCreditAccountProps = {},
    config: FindConfig<LoyaltyTypes.StoreCreditAccountDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<LoyaltyTypes.StoreCreditAccountDTO[]> {
    const accounts = await super.listStoreCreditAccounts(
      filters,
      config,
      sharedContext
    )

    await this.populateAccountStats_(accounts, sharedContext)

    return accounts
  }

  @InjectManager()
  // @ts-expect-error - overriding parent method
  async listAndCountStoreCreditAccounts(
    filters: LoyaltyTypes.FilterableStoreCreditAccountProps = {},
    config: FindConfig<LoyaltyTypes.StoreCreditAccountDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<[LoyaltyTypes.StoreCreditAccountDTO[], number]> {
    const [accounts, count] = await super.listAndCountStoreCreditAccounts(
      filters,
      config,
      sharedContext
    )

    await this.populateAccountStats_(accounts, sharedContext)

    return [accounts, count]
  }

  @InjectManager()
  // @ts-expect-error - overriding parent method
  async retrieveStoreCreditAccount(
    id: string,
    config: FindConfig<LoyaltyTypes.StoreCreditAccountDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<LoyaltyTypes.StoreCreditAccountDTO> {
    const account = await super.retrieveStoreCreditAccount(
      id,
      config,
      sharedContext
    )

    await this.populateAccountStats_([account], sharedContext)

    return account
  }

  @InjectTransactionManager()
  // @ts-expect-error - overriding parent method
  async updateStoreCreditAccounts(
    data:
      | LoyaltyTypes.UpdateStoreCreditAccountDTO
      | LoyaltyTypes.UpdateStoreCreditAccountDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<
    LoyaltyTypes.StoreCreditAccountDTO | LoyaltyTypes.StoreCreditAccountDTO[]
  > {
    /*
      We should only allow updating the whitelisted fields for store credit accounts.
      Changing the customer or currency code will lead to unexpected results where balances are not tracked correctly.
    */
    const whitelistedFields = ["id", "metadata"]
    const normalizedData = Array.isArray(data) ? data : [data]

    normalizedData.forEach((account) => {
      Object.keys(account).forEach((key) => {
        if (whitelistedFields.includes(key)) {
          throw new Error(`Field ${key} is not allowed to be updated`)
        }
      })
    })

    return await super.updateStoreCreditAccounts(normalizedData, sharedContext)
  }

  @InjectTransactionManager()
  // @ts-expect-error
  async deleteStoreCreditAccounts(
    ids: string | string[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    /*
      TODO: Before deleting the accounts, we should check if the accounts have any transactions.
      If they do, we should throw an error.

      We should only allow deleting accounts that have no transactions.

      We should not allow deleting accounts that have any transactions.
      We should instead "close" an account only after balance is zero.
    */

    return await super.deleteStoreCreditAccounts(ids, sharedContext)
  }

  @InjectTransactionManager()
  // @ts-expect-error
  async softDeleteStoreCreditAccounts<
    TReturnableLinkableKeys extends string = string
  >(
    ids: string | string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<Record<string, string[]> | void> {
    /*
      TODO: Before soft deleting the accounts, we should check if the accounts have any transactions.
      If they do, we should throw an error.

      We should only allow soft deleting accounts that have no transactions.

      We should not allow soft deleting accounts that have any transactions.
      We should instead "close" an account only after balance is zero.
    */

    return await super.softDeleteStoreCreditAccounts(ids, config, sharedContext)
  }

  // ==========================================
  // Transaction Methods
  // ==========================================

  @InjectManager()
  async retrieveAccountStats(
    data: { account_id: string },
    @MedusaContext() sharedContext: Context = {}
  ): Promise<LoyaltyTypes.AccountStatsDTO> {
    const manager =
      (sharedContext.transactionManager as SqlEntityManager) ??
      (sharedContext.manager as SqlEntityManager)
    const knex = manager.getTransactionContext() ?? manager.getKnex()
    const { account_id } = data

    const account = await super.retrieveStoreCreditAccount(
      account_id,
      {},
      sharedContext
    )

    // TODO: For higher accuracy and precision, we should run the transaction amounts through big number
    // in memory and then use that value for the balance.
    // We need to figure out clever ways to do this without running too many calculations in memory
    const accountBalanceQuery = knex("store_credit_account as account")
      .select({
        id: "account.id",
        credits: knex.raw(
          `COALESCE(SUM(CASE WHEN at.type = 'credit' THEN at.amount ELSE 0 END), 0)`
        ),
        debits: knex.raw(
          `COALESCE(SUM(CASE WHEN at.type = 'debit' THEN at.amount ELSE 0 END), 0)`
        ),
        balance: knex.raw(
          `COALESCE(SUM(CASE WHEN at.type = 'credit' THEN at.amount::numeric ELSE -at.amount::numeric END), 0)`
        ),
      })
      .leftJoin(
        "store_credit_account_transaction as at",
        "at.account_id",
        "account.id"
      )
      .where("account.id", account.id)
      .groupBy("account.id")

    const accountBalances: {
      id: string
      balance: string
      debits: string
      credits: string
    }[] = await accountBalanceQuery

    const accountBalance = accountBalances[0]

    const response = {
      id: account.id,
      balance: MathBN.convert(accountBalance.balance).toNumber(),
      debits: MathBN.convert(accountBalance.debits).toNumber(),
      credits: MathBN.convert(accountBalance.credits).toNumber(),
    }

    return await this.baseRepository_.serialize(response)
  }

  @InjectManager()
  async creditAccounts(
    data: LoyaltyTypes.CreditAccountDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<LoyaltyTypes.AccountTransactionDTO[]> {
    const transactions = await this.creditAccounts_(data, sharedContext)
    return await this.baseRepository_.serialize<
      LoyaltyTypes.AccountTransactionDTO[]
    >(transactions)
  }

  @InjectTransactionManager()
  protected async creditAccounts_(
    creditAccountsData: LoyaltyTypes.CreditAccountDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof AccountTransaction>[]> {
    const transactions: InferEntityType<typeof AccountTransaction>[] = []

    for (const data of creditAccountsData) {
      const { account_id, amount, reference, reference_id, note } = data

      if (!account_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Account ID is required"
        )
      }

      if (!isDefined(amount)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Amount is required"
        )
      }

      const storeCreditAccount = await super.retrieveStoreCreditAccount(
        account_id,
        {},
        sharedContext
      )

      const createdTransactions = await this.accountTransactionService_.create(
        [
          {
            account_id: storeCreditAccount.id,
            amount,
            type: LoyaltyTypes.TransactionType.CREDIT,
            reference,
            reference_id,
            note,
          },
        ],
        sharedContext
      )

      transactions.push(...createdTransactions)
    }

    return transactions
  }

  @InjectManager()
  async debitAccounts(
    data: LoyaltyTypes.DebitAccountDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<LoyaltyTypes.AccountTransactionDTO[]> {
    const transactions = await this.debitAccounts_(data, sharedContext)
    return await this.baseRepository_.serialize<
      LoyaltyTypes.AccountTransactionDTO[]
    >(transactions)
  }

  @InjectTransactionManager()
  protected async debitAccounts_(
    debitAccountsData: LoyaltyTypes.DebitAccountDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof AccountTransaction>[]> {
    const manager = sharedContext.transactionManager as SqlEntityManager
    const transactions: InferEntityType<typeof AccountTransaction>[] = []

    for (const data of debitAccountsData) {
      const { account_id, amount, reference, reference_id, note } = data

      const amountBN = MathBN.convert(amount)

      if (!account_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Account ID is required"
        )
      }

      if (!isDefined(amount)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Amount is required"
        )
      }

      if (amountBN.lte(0)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Amount must be greater than 0"
        )
      }

      const accountStats = await this.retrieveAccountStats(
        { account_id },
        sharedContext
      )

      if (MathBN.convert(accountStats.balance).lt(amountBN)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Insufficient balance"
        )
      }

      const createdTransaction = await this.accountTransactionService_.create(
        {
          account_id: accountStats.id,
          amount: amountBN,
          type: LoyaltyTypes.TransactionType.DEBIT,
          reference,
          reference_id,
          note,
        },
        sharedContext
      )

      transactions.push(createdTransaction)

      await manager.flush()
    }

    return transactions
  }

  protected async populateAccountStats_(
    accountOrAccounts:
      | LoyaltyTypes.StoreCreditAccountDTO
      | LoyaltyTypes.StoreCreditAccountDTO[],
    sharedContext?: Context
  ): Promise<void> {
    const normalized = Array.isArray(accountOrAccounts)
      ? accountOrAccounts
      : [accountOrAccounts]

    await Promise.all(
      normalized.map(async (account) => {
        const stats = await this.retrieveAccountStats(
          { account_id: account.id },
          sharedContext
        )

        account.balance = stats.balance
        account.credits = stats.credits
        account.debits = stats.debits
      })
    )
  }
}

export default LoyaltyModuleService
