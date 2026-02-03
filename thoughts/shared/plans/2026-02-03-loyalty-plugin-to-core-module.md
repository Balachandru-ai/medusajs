# Loyalty Plugin to Core Module Migration Plan

## Overview

This plan outlines the migration of the loyalty plugin from `/Users/ters/Desktop/work/medusa/local-development/loyalty-plugin` into the Medusa monorepo as a first-class commerce module. The plugin currently has two modules (Loyalty and Store Credit) that will be combined into a single unified "Loyalty" module.

## Current State Analysis

### Plugin Structure
- **Two separate modules**: `loyalty` (gift cards) and `store_credit` (store credit accounts)
- **Models**: 3 total (GiftCard, StoreCreditAccount, AccountTransaction)
- **Migrations**: 14 total (7 for each module)
- **Workflows**: 17 workflows + 4 workflow hooks
- **API Routes**: 28 route files (admin and store)
- **Admin UI**: 70+ React components and pages
- **Integration Tests**: 9 spec files

### Key Dependencies
- The plugin hooks into existing core workflows: `completeCartWorkflow`, `refreshCartItemsWorkflow`, `createOrderCreditLinesWorkflow`
- Links to core modules: Cart, Order, Customer, OrderLineItem

## Desired End State

After completing this migration:
1. A new `@medusajs/medusa/loyalty` module exists in `packages/modules/loyalty`
2. The `Modules` enum includes `LOYALTY: "loyalty"`
3. Loyalty workflows and steps exist in `packages/core/core-flows/src/loyalty`
4. Cart/order-related loyalty steps are integrated into existing cart/order workflows
5. Loyalty types are in `packages/core/types/src/loyalty` and HTTP types in `packages/core/types/src/http/loyalty`
6. Loyalty API routes maintain backward compatibility with the plugin:
   - Admin: `packages/medusa/src/api/admin/gift-cards` and `packages/medusa/src/api/admin/store-credit-accounts`
   - Store: `packages/medusa/src/api/store/gift-cards`, `packages/medusa/src/api/store/store-credit-accounts`, and cart sub-routes
7. Link module definitions exist in `packages/modules/link-modules/src/definitions`
8. Admin dashboard has native loyalty management pages in `packages/admin/dashboard/src/routes/gift-cards` and `packages/admin/dashboard/src/routes/store-credit-accounts`
9. Integration tests pass in `integration-tests/http/__tests__/gift-cards` and `integration-tests/http/__tests__/store-credit-accounts`
10. The subscriber is a core subscriber in `packages/medusa/src/subscribers`

### Verification Criteria
- `yarn build` completes without errors
- `yarn test:integration:modules` passes for loyalty module
- `yarn test:integration:http` passes for loyalty API tests
- Admin dashboard builds and displays loyalty pages
- Gift cards can be created, redeemed, and linked to orders
- Store credit accounts can be created, credited, debited, and linked to customers

## What We're NOT Doing

- Changing the fundamental business logic of the loyalty/store credit features
- Adding new features beyond what exists in the plugin
- Creating a separate "Store Credit" module (will be merged into Loyalty)
- Migrating provider implementations (the plugin has none)
- Creating documentation beyond code comments

## Implementation Approach

The migration will be done in phases to ensure each component works before moving to the next. We'll follow the existing monorepo patterns closely to maintain consistency.

---

## Phase 1: Module Registration and Types

### Overview
Register the new Loyalty module in the Modules enum and create all necessary type definitions.

### Changes Required:

#### 1. Add Loyalty to Modules Enum

**File**: `packages/core/utils/src/modules-sdk/definition.ts`
**Changes**: Add LOYALTY to Modules enum and MODULE_PACKAGE_NAMES

```typescript
// Add to Modules const (around line 32, before the closing brace)
LOYALTY: "loyalty",

// Add to MODULE_PACKAGE_NAMES (around line 66)
[Modules.LOYALTY]: "@medusajs/medusa/loyalty",
```

#### 2. Create Module Types

**File**: `packages/core/types/src/loyalty/index.ts`
```typescript
export * from "./common"
export * from "./mutations"
export * from "./service"
```

**File**: `packages/core/types/src/loyalty/common.ts`
```typescript
import { BaseFilterable, OperatorMap, BigNumberValue } from "../dal"

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

// Gift Card Types
export interface GiftCardDTO {
  id: string
  status: GiftCardStatus
  value: BigNumberValue
  balance: BigNumberValue
  code: string
  currency_code: string
  expires_at: Date | null
  reference_id: string | null
  reference: string | null
  line_item_id: string | null
  note: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface FilterableGiftCardProps
  extends BaseFilterable<FilterableGiftCardProps> {
  q?: string
  id?: string | string[]
  code?: string | string[]
  reference_id?: string | string[]
  reference?: string | string[]
  status?: GiftCardStatus | GiftCardStatus[]
  currency_code?: string | string[]
}

// Store Credit Account Types
export interface StoreCreditAccountDTO {
  id: string
  code: string | null
  currency_code: string
  customer_id: string | null
  balance: number
  credits: number
  debits: number
  metadata: Record<string, unknown> | null
  transactions?: AccountTransactionDTO[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface FilterableStoreCreditAccountProps
  extends BaseFilterable<FilterableStoreCreditAccountProps> {
  q?: string
  id?: string | string[]
  currency_code?: string | string[]
  customer_id?: string | string[]
}

// Account Transaction Types
export interface AccountTransactionDTO {
  id: string
  amount: BigNumberValue
  type: TransactionType
  reference: string
  reference_id: string
  note: string | null
  account_id: string
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface FilterableAccountTransactionProps
  extends BaseFilterable<FilterableAccountTransactionProps> {
  id?: string | string[]
  account_id?: string | string[]
}

export interface AccountStatsDTO {
  id: string
  balance: number
  credits: number
  debits: number
}
```

**File**: `packages/core/types/src/loyalty/mutations.ts`
```typescript
import { BigNumberValue } from "../dal"
import { GiftCardStatus } from "./common"

// Gift Card Mutations
export interface CreateGiftCardDTO {
  value: BigNumberValue
  currency_code: string
  code?: string
  status?: GiftCardStatus
  expires_at?: Date | null
  reference_id?: string | null
  reference?: string | null
  line_item_id?: string | null
  note?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateGiftCardDTO {
  id: string
  status?: GiftCardStatus
  value?: BigNumberValue
  expires_at?: Date | null
  note?: string | null
  metadata?: Record<string, unknown> | null
}

// Store Credit Account Mutations
export interface CreateStoreCreditAccountDTO {
  currency_code: string
  customer_id?: string | null
  code?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateStoreCreditAccountDTO {
  id: string
  metadata?: Record<string, unknown> | null
}

// Transaction Mutations
export interface CreditAccountDTO {
  account_id: string
  amount: BigNumberValue
  reference: string
  reference_id: string
  note?: string | null
}

export interface DebitAccountDTO {
  account_id: string
  amount: BigNumberValue
  reference: string
  reference_id: string
  note?: string | null
}
```

**File**: `packages/core/types/src/loyalty/service.ts`
```typescript
import { Context, FindConfig, IModuleService, RestoreReturn, SoftDeleteReturn } from "../common"
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

export interface ILoyaltyModuleService extends IModuleService {
  // Gift Card Methods
  createGiftCards(
    data: CreateGiftCardDTO,
    sharedContext?: Context
  ): Promise<GiftCardDTO>
  createGiftCards(
    data: CreateGiftCardDTO[],
    sharedContext?: Context
  ): Promise<GiftCardDTO[]>

  updateGiftCards(
    data: UpdateGiftCardDTO,
    sharedContext?: Context
  ): Promise<GiftCardDTO>
  updateGiftCards(
    data: UpdateGiftCardDTO[],
    sharedContext?: Context
  ): Promise<GiftCardDTO[]>

  listGiftCards(
    filters?: FilterableGiftCardProps,
    config?: FindConfig<GiftCardDTO>,
    sharedContext?: Context
  ): Promise<GiftCardDTO[]>

  listAndCountGiftCards(
    filters?: FilterableGiftCardProps,
    config?: FindConfig<GiftCardDTO>,
    sharedContext?: Context
  ): Promise<[GiftCardDTO[], number]>

  retrieveGiftCard(
    id: string,
    config?: FindConfig<GiftCardDTO>,
    sharedContext?: Context
  ): Promise<GiftCardDTO>

  deleteGiftCards(ids: string[], sharedContext?: Context): Promise<void>

  softDeleteGiftCards<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  restoreGiftCards<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  // Store Credit Account Methods
  createStoreCreditAccounts(
    data: CreateStoreCreditAccountDTO,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO>
  createStoreCreditAccounts(
    data: CreateStoreCreditAccountDTO[],
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO[]>

  updateStoreCreditAccounts(
    data: UpdateStoreCreditAccountDTO,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO>
  updateStoreCreditAccounts(
    data: UpdateStoreCreditAccountDTO[],
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO[]>

  listStoreCreditAccounts(
    filters?: FilterableStoreCreditAccountProps,
    config?: FindConfig<StoreCreditAccountDTO>,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO[]>

  listAndCountStoreCreditAccounts(
    filters?: FilterableStoreCreditAccountProps,
    config?: FindConfig<StoreCreditAccountDTO>,
    sharedContext?: Context
  ): Promise<[StoreCreditAccountDTO[], number]>

  retrieveStoreCreditAccount(
    id: string,
    config?: FindConfig<StoreCreditAccountDTO>,
    sharedContext?: Context
  ): Promise<StoreCreditAccountDTO>

  deleteStoreCreditAccounts(ids: string[], sharedContext?: Context): Promise<void>

  softDeleteStoreCreditAccounts<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: SoftDeleteReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  restoreStoreCreditAccounts<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>

  // Transaction Methods
  listAccountTransactions(
    filters: FilterableAccountTransactionProps,
    config?: FindConfig<AccountTransactionDTO>,
    sharedContext?: Context
  ): Promise<AccountTransactionDTO[]>

  retrieveAccountStats(
    data: { account_id: string },
    sharedContext?: Context
  ): Promise<AccountStatsDTO>

  creditAccounts(
    data: CreditAccountDTO[],
    sharedContext?: Context
  ): Promise<AccountTransactionDTO[]>

  debitAccounts(
    data: DebitAccountDTO[],
    sharedContext?: Context
  ): Promise<AccountTransactionDTO[]>

  deleteAccountTransactions(ids: string[], sharedContext?: Context): Promise<void>
}
```

#### 3. Export Types from Root Index

**File**: `packages/core/types/src/index.ts`
**Changes**: Add loyalty export (alphabetically)

```typescript
// Add this line in alphabetical order with other module exports
export * from "./loyalty"
```

#### 4. Create HTTP Types

**File**: `packages/core/types/src/http/loyalty/index.ts`
```typescript
export * from "./admin"
export * from "./store"
```

**File**: `packages/core/types/src/http/loyalty/admin/index.ts`
```typescript
export * from "./entities"
export * from "./payloads"
export * from "./queries"
export * from "./responses"
```

**File**: `packages/core/types/src/http/loyalty/admin/entities.ts`
```typescript
import {
  GiftCardDTO,
  StoreCreditAccountDTO,
  AccountTransactionDTO,
  GiftCardStatus,
  TransactionType,
} from "../../../loyalty"

export interface AdminGiftCard extends Omit<GiftCardDTO, "deleted_at"> {}

export interface AdminStoreCreditAccount extends Omit<StoreCreditAccountDTO, "deleted_at"> {
  transactions?: AdminAccountTransaction[]
}

export interface AdminAccountTransaction extends AccountTransactionDTO {}
```

**File**: `packages/core/types/src/http/loyalty/admin/payloads.ts`
```typescript
import { GiftCardStatus } from "../../../loyalty"

export interface AdminCreateGiftCard {
  value: number
  currency_code: string
  code?: string
  status?: GiftCardStatus
  expires_at?: string | null
  reference_id?: string | null
  reference?: string | null
  note?: string | null
  metadata?: Record<string, unknown>
}

export interface AdminUpdateGiftCard {
  status?: GiftCardStatus
  value?: number
  expires_at?: string | null
  note?: string | null
  metadata?: Record<string, unknown>
}

export interface AdminCreateStoreCreditAccount {
  currency_code: string
  customer_id?: string | null
  code?: string | null
  metadata?: Record<string, unknown>
}

export interface AdminCreditStoreCreditAccount {
  amount: number
  reference: string
  reference_id: string
  note?: string | null
}
```

**File**: `packages/core/types/src/http/loyalty/admin/queries.ts`
```typescript
import { BaseFilterable, FindParams, OperatorMap } from "../../common"
import { GiftCardStatus } from "../../../loyalty"

export interface AdminGetGiftCardsParams
  extends FindParams,
    BaseFilterable<AdminGetGiftCardsParams> {
  q?: string
  id?: string | string[]
  code?: string | string[]
  status?: GiftCardStatus | GiftCardStatus[]
  currency_code?: string | string[]
  created_at?: OperatorMap<string>
  updated_at?: OperatorMap<string>
}

export interface AdminGetStoreCreditAccountsParams
  extends FindParams,
    BaseFilterable<AdminGetStoreCreditAccountsParams> {
  q?: string
  id?: string | string[]
  currency_code?: string | string[]
  customer_id?: string | string[]
  created_at?: OperatorMap<string>
  updated_at?: OperatorMap<string>
}

export interface AdminGetAccountTransactionsParams
  extends FindParams,
    BaseFilterable<AdminGetAccountTransactionsParams> {
  id?: string | string[]
  account_id?: string | string[]
  created_at?: OperatorMap<string>
}
```

**File**: `packages/core/types/src/http/loyalty/admin/responses.ts`
```typescript
import { DeleteResponse, PaginatedResponse } from "../../common"
import { AdminGiftCard, AdminStoreCreditAccount, AdminAccountTransaction } from "./entities"

export interface AdminGiftCardResponse {
  gift_card: AdminGiftCard
}

export type AdminGiftCardListResponse = PaginatedResponse<{
  gift_cards: AdminGiftCard[]
}>

export type AdminGiftCardDeleteResponse = DeleteResponse<"gift_card">

export interface AdminStoreCreditAccountResponse {
  store_credit_account: AdminStoreCreditAccount
}

export type AdminStoreCreditAccountListResponse = PaginatedResponse<{
  store_credit_accounts: AdminStoreCreditAccount[]
}>

export type AdminStoreCreditAccountDeleteResponse = DeleteResponse<"store_credit_account">

export type AdminAccountTransactionListResponse = PaginatedResponse<{
  transactions: AdminAccountTransaction[]
}>
```

**File**: `packages/core/types/src/http/loyalty/store/index.ts`
```typescript
export * from "./entities"
export * from "./payloads"
export * from "./queries"
export * from "./responses"
```

**File**: `packages/core/types/src/http/loyalty/store/entities.ts`
```typescript
import { GiftCardDTO, StoreCreditAccountDTO, GiftCardStatus } from "../../../loyalty"

export interface StoreGiftCard {
  id: string
  code: string
  balance: number
  currency_code: string
  status: GiftCardStatus
  expires_at: Date | null
}

export interface StoreStoreCreditAccount {
  id: string
  currency_code: string
  balance: number
  customer_id: string | null
}
```

**File**: `packages/core/types/src/http/loyalty/store/payloads.ts`
```typescript
export interface StoreAddGiftCardToCart {
  code: string
}

export interface StoreApplyStoreCredits {
  amount?: number
}

export interface StoreClaimStoreCreditAccount {
  code: string
}
```

**File**: `packages/core/types/src/http/loyalty/store/queries.ts`
```typescript
import { FindParams } from "../../common"

export interface StoreGetGiftCardParams extends FindParams {}

export interface StoreGetStoreCreditAccountsParams extends FindParams {
  currency_code?: string
}
```

**File**: `packages/core/types/src/http/loyalty/store/responses.ts`
```typescript
import { PaginatedResponse } from "../../common"
import { StoreGiftCard, StoreStoreCreditAccount } from "./entities"

export interface StoreGiftCardResponse {
  gift_card: StoreGiftCard
}

export interface StoreStoreCreditAccountResponse {
  store_credit_account: StoreStoreCreditAccount
}

export type StoreStoreCreditAccountListResponse = PaginatedResponse<{
  store_credit_accounts: StoreStoreCreditAccount[]
}>
```

#### 5. Export HTTP Types from Root

**File**: `packages/core/types/src/http/index.ts`
**Changes**: Add loyalty export

```typescript
// Add in alphabetical order
export * from "./loyalty"
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation passes: `yarn workspace @medusajs/types build`
- [ ] No type errors in the new files

#### Manual Verification:
- [ ] Types can be imported from `@medusajs/framework/types`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Loyalty Module Implementation

### Overview
Create the actual Loyalty module in `packages/modules/loyalty` with models, services, migrations, and configuration.

### Changes Required:

#### 1. Create Module Package Structure

Create the following directory structure:
```
packages/modules/loyalty/
├── src/
│   ├── index.ts
│   ├── joiner-config.ts
│   ├── schema/
│   │   └── index.ts
│   ├── models/
│   │   ├── index.ts
│   │   ├── gift-card.ts
│   │   ├── store-credit-account.ts
│   │   └── account-transaction.ts
│   ├── services/
│   │   ├── index.ts
│   │   └── loyalty-module-service.ts
│   ├── migrations/
│   │   └── Migration_Initial.ts
│   └── utils/
│       ├── index.ts
│       └── code-generator.ts
├── mikro-orm.config.dev.ts
├── tsconfig.json
└── package.json
```

#### 2. Package Configuration

**File**: `packages/modules/loyalty/package.json`
```json
{
  "name": "@medusajs/loyalty",
  "version": "2.13.1",
  "description": "Medusa Loyalty Module - Gift Cards and Store Credit",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "!dist/**/__tests__",
    "!dist/**/__fixtures__",
    "!dist/**/__mocks__"
  ],
  "engines": {
    "node": ">=20"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/medusajs/medusa",
    "directory": "packages/modules/loyalty"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "watch": "yarn run -T tsc --build --watch",
    "build": "yarn run -T rimraf dist && yarn run -T tsc --build && npm run resolve:aliases",
    "resolve:aliases": "yarn run -T tsc-alias -p tsconfig.json",
    "test": "../../../node_modules/.bin/jest --bail --forceExit --testPathPattern=src",
    "test:integration": "../../../node_modules/.bin/jest --passWithNoTests --bail --forceExit --testPathPattern=\"integration-tests/__tests__/.*\\.spec\\.ts\"",
    "migration:initial": "MIKRO_ORM_CLI_CONFIG=./mikro-orm.config.dev.ts MIKRO_ORM_ALLOW_GLOBAL_CLI=true medusa-mikro-orm migration:create --initial",
    "migration:create": "MIKRO_ORM_CLI_CONFIG=./mikro-orm.config.dev.ts MIKRO_ORM_ALLOW_GLOBAL_CLI=true medusa-mikro-orm migration:create"
  },
  "peerDependencies": {
    "@medusajs/framework": "2.13.1"
  },
  "devDependencies": {
    "@medusajs/framework": "2.13.1",
    "@medusajs/test-utils": "2.13.1"
  },
  "keywords": [
    "medusa",
    "medusa-module",
    "loyalty",
    "gift-card",
    "store-credit"
  ],
  "author": "Medusa"
}
```

**File**: `packages/modules/loyalty/tsconfig.json`
```json
{
  "extends": "../../../_tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@models": ["./src/models"],
      "@services": ["./src/services"],
      "@types": ["./src/types"],
      "@utils": ["./src/utils"]
    }
  }
}
```

**File**: `packages/modules/loyalty/mikro-orm.config.dev.ts`
```typescript
import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"
import * as entities from "./src/models"

export default defineMikroOrmCliConfig(Modules.LOYALTY, {
  entities: Object.values(entities),
})
```

#### 3. Models

**File**: `packages/modules/loyalty/src/models/gift-card.ts`
```typescript
import { model } from "@medusajs/framework/utils"

export const GiftCardStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  REDEEMED: "redeemed",
  DISABLED: "disabled",
  EXPIRED: "expired",
} as const

const GiftCard = model.define(
  { tableName: "loyalty_gift_card", name: "GiftCard" },
  {
    id: model.id({ prefix: "gcard" }).primaryKey(),
    status: model.enum(Object.values(GiftCardStatus)).default("pending"),
    value: model.bigNumber(),
    balance: model.bigNumber(),
    code: model.text().searchable().unique(),
    currency_code: model.text().searchable(),
    expires_at: model.dateTime().nullable(),
    reference_id: model.text().nullable(),
    reference: model.text().nullable(),
    line_item_id: model.text().nullable(),
    note: model.text().nullable(),
    metadata: model.json().nullable(),
  }
)

export default GiftCard
```

**File**: `packages/modules/loyalty/src/models/store-credit-account.ts`
```typescript
import { model } from "@medusajs/framework/utils"
import AccountTransaction from "./account-transaction"

const StoreCreditAccount = model
  .define(
    { tableName: "loyalty_store_credit_account", name: "StoreCreditAccount" },
    {
      id: model.id({ prefix: "sc_acc" }).primaryKey(),
      code: model.text().nullable(),
      currency_code: model.text().searchable(),
      customer_id: model.text().nullable(),
      metadata: model.json().nullable(),

      transactions: model.hasMany(() => AccountTransaction, {
        mappedBy: "account",
      }),
    }
  )
  .indexes([
    {
      name: "IDX_loyalty_customer_id_currency_code",
      on: ["customer_id", "currency_code"],
      unique: true,
      where: "customer_id IS NOT NULL",
    },
  ])

export default StoreCreditAccount
```

**File**: `packages/modules/loyalty/src/models/account-transaction.ts`
```typescript
import { model } from "@medusajs/framework/utils"
import StoreCreditAccount from "./store-credit-account"

export const TransactionType = {
  CREDIT: "credit",
  DEBIT: "debit",
} as const

const AccountTransaction = model.define(
  { tableName: "loyalty_account_transaction", name: "AccountTransaction" },
  {
    id: model.id({ prefix: "sc_trx" }).primaryKey(),
    amount: model.bigNumber(),
    type: model.enum(Object.values(TransactionType)),
    reference: model.text(),
    reference_id: model.text(),
    note: model.text().nullable(),
    metadata: model.json().nullable(),

    account: model.belongsTo(() => StoreCreditAccount, {
      mappedBy: "transactions",
    }),
  }
)

export default AccountTransaction
```

**File**: `packages/modules/loyalty/src/models/index.ts`
```typescript
export { default as GiftCard } from "./gift-card"
export { default as StoreCreditAccount } from "./store-credit-account"
export { default as AccountTransaction } from "./account-transaction"
export { GiftCardStatus } from "./gift-card"
export { TransactionType } from "./account-transaction"
```

#### 4. Services

**File**: `packages/modules/loyalty/src/services/loyalty-module-service.ts`

Copy and adapt the service from the plugin, combining both `LoyaltyModuleService` and `StoreCreditService` into a single service class. The service should:
- Extend `MedusaService` with all three models
- Include all gift card CRUD methods
- Include all store credit account CRUD methods
- Include `creditAccounts` and `debitAccounts` methods
- Include `retrieveAccountStats` for balance calculations
- Use decorators: `@InjectManager`, `@InjectTransactionManager`, `@MedusaContext`, `@EmitEvents`

**File**: `packages/modules/loyalty/src/services/index.ts`
```typescript
export { LoyaltyModuleService } from "./loyalty-module-service"
```

#### 5. Module Entry Point

**File**: `packages/modules/loyalty/src/index.ts`
```typescript
import { Module, Modules } from "@medusajs/framework/utils"
import { LoyaltyModuleService } from "@services"

export default Module(Modules.LOYALTY, {
  service: LoyaltyModuleService,
})
```

#### 6. Joiner Config and Schema

**File**: `packages/modules/loyalty/src/joiner-config.ts`
```typescript
import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import { GiftCard, StoreCreditAccount, AccountTransaction } from "@models"
import { default as schema } from "./schema"

export const joinerConfig = defineJoinerConfig(Modules.LOYALTY, {
  schema,
  models: [GiftCard, StoreCreditAccount, AccountTransaction],
  linkableKeys: {
    gift_card_id: "GiftCard",
    store_credit_account_id: "StoreCreditAccount",
  },
  primaryKeys: ["id", "code"],
  alias: [
    {
      name: ["gift_card", "gift_cards"],
      entity: "GiftCard",
      args: { methodSuffix: "GiftCards" },
    },
    {
      name: ["store_credit_account", "store_credit_accounts"],
      entity: "StoreCreditAccount",
      args: { methodSuffix: "StoreCreditAccounts" },
    },
    {
      name: ["account_transaction", "account_transactions"],
      entity: "AccountTransaction",
      args: { methodSuffix: "AccountTransactions" },
    },
  ],
})
```

**File**: `packages/modules/loyalty/src/schema/index.ts`
```typescript
export default `
enum GiftCardStatus {
  pending
  active
  redeemed
  disabled
  expired
}

enum TransactionType {
  credit
  debit
}

type GiftCard {
  id: ID!
  status: GiftCardStatus!
  value: Float!
  balance: Float!
  code: String!
  currency_code: String!
  expires_at: DateTime
  reference_id: String
  reference: String
  line_item_id: String
  note: String
  metadata: JSON
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type StoreCreditAccount {
  id: ID!
  code: String
  currency_code: String!
  customer_id: String
  balance: Float
  credits: Float
  debits: Float
  transactions: [AccountTransaction]
  metadata: JSON
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type AccountTransaction {
  id: ID!
  amount: Float!
  type: TransactionType!
  reference: String!
  reference_id: String!
  note: String
  account_id: String!
  account: StoreCreditAccount
  metadata: JSON
  created_at: DateTime!
  updated_at: DateTime!
}
`
```

#### 7. Utils

**File**: `packages/modules/loyalty/src/utils/code-generator.ts`
```typescript
import { randomBytes } from "crypto"

const CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"

function generateSegment(length: number): string {
  const bytes = randomBytes(length)
  let segment = ""
  for (let i = 0; i < length; i++) {
    segment += CHARS[bytes[i] % CHARS.length]
  }
  return segment
}

export function generateCode(prefix: string = "GC"): string {
  const segments = [
    prefix,
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
  ]
  return segments.join("-")
}
```

**File**: `packages/modules/loyalty/src/utils/index.ts`
```typescript
export * from "./code-generator"
```

#### 8. Migration (Idempotent)

**File**: `packages/modules/loyalty/src/migrations/Migration_Initial.ts`

Create an idempotent migration that works for:
- **Existing plugin users (up to date)**: Tables already exist, nothing changes
- **Existing plugin users (not up to date)**: Only missing columns/indexes are added
- **New users**: All tables and indexes are created fresh

The migration MUST use idempotent patterns throughout:

```typescript
import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration_Initial extends Migration {
  async up(): Promise<void> {
    // ============================================
    // GIFT CARD TABLE
    // ============================================

    // Create table if it doesn't exist (for new users)
    this.addSql(`
      create table if not exists "loyalty_gift_card" (
        "id" text not null,
        "status" text check ("status" in ('pending', 'active', 'redeemed', 'disabled', 'expired')) not null default 'pending',
        "value" numeric not null,
        "balance" numeric not null,
        "code" text not null,
        "currency_code" text not null,
        "expires_at" timestamptz null,
        "reference_id" text null,
        "reference" text null,
        "line_item_id" text null,
        "note" text null,
        "metadata" jsonb null,
        "raw_value" jsonb not null,
        "raw_balance" jsonb not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "loyalty_gift_card_pkey" primary key ("id")
      );
    `)

    // Add columns that may be missing for existing plugin users not fully up to date
    this.addSql(`alter table if exists "loyalty_gift_card" add column if not exists "balance" numeric;`)
    this.addSql(`alter table if exists "loyalty_gift_card" add column if not exists "raw_balance" jsonb;`)
    this.addSql(`alter table if exists "loyalty_gift_card" add column if not exists "reference_id" text null;`)
    this.addSql(`alter table if exists "loyalty_gift_card" add column if not exists "reference" text null;`)

    // Update status enum to include all values (idempotent - PostgreSQL handles this gracefully)
    // Note: PostgreSQL doesn't support IF NOT EXISTS for enum values directly,
    // but the check constraint allows any of the listed values

    // Create indexes (IF NOT EXISTS makes these idempotent)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_loyalty_gift_card_code_unique" ON "loyalty_gift_card" (code) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_loyalty_gift_card_deleted_at" ON "loyalty_gift_card" (deleted_at) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_loyalty_gift_card_currency_code" ON "loyalty_gift_card" (currency_code) WHERE deleted_at IS NULL;`)

    // Drop old columns/indexes that were removed in plugin updates (idempotent)
    this.addSql(`alter table if exists "loyalty_gift_card" drop column if exists "customer_id";`)
    this.addSql(`drop index if exists "IDX_line_item_id_customer_id";`)

    // Drop the invitation table if it exists (was removed in later plugin versions)
    this.addSql(`drop table if exists "loyalty_gift_card_invitation" cascade;`)

    // ============================================
    // STORE CREDIT ACCOUNT TABLE
    // ============================================

    // Create table if it doesn't exist
    this.addSql(`
      create table if not exists "store_credit_account" (
        "id" text not null,
        "code" text null,
        "currency_code" text not null,
        "customer_id" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_credit_account_pkey" primary key ("id")
      );
    `)

    // Add columns that may be missing
    this.addSql(`alter table if exists "store_credit_account" add column if not exists "code" text null;`)

    // Update customer_id to be nullable (for unclaimed accounts)
    // This is safe to run multiple times
    this.addSql(`alter table if exists "store_credit_account" alter column "customer_id" drop not null;`)

    // Create indexes
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_credit_account_deleted_at" ON "store_credit_account" (deleted_at) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_id_currency_code" ON "store_credit_account" (customer_id, currency_code) WHERE customer_id IS NOT NULL AND deleted_at IS NULL;`)

    // Drop old transaction group table if it exists (was removed in later plugin versions)
    this.addSql(`drop table if exists "store_credit_transaction_group" cascade;`)

    // ============================================
    // ACCOUNT TRANSACTION TABLE
    // ============================================

    // Create table if it doesn't exist
    this.addSql(`
      create table if not exists "store_credit_account_transaction" (
        "id" text not null,
        "amount" numeric not null,
        "type" text check ("type" in ('credit', 'debit')) not null,
        "reference" text not null,
        "reference_id" text not null,
        "note" text null,
        "account_id" text not null,
        "metadata" jsonb null,
        "raw_amount" jsonb not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "store_credit_account_transaction_pkey" primary key ("id")
      );
    `)

    // Create indexes
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_credit_account_transaction_account_id" ON "store_credit_account_transaction" (account_id);`)

    // Add foreign key if it doesn't exist (idempotent via naming)
    this.addSql(`
      DO $$ BEGIN
        ALTER TABLE "store_credit_account_transaction"
        ADD CONSTRAINT "store_credit_account_transaction_account_id_foreign"
        FOREIGN KEY ("account_id") REFERENCES "store_credit_account" ("id") ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Drop old columns that were removed
    this.addSql(`drop index if exists "IDX_store_credit_account_transaction_transaction_group_id";`)
    this.addSql(`alter table if exists "store_credit_account_transaction" drop column if exists "transaction_group_id";`)
    this.addSql(`alter table if exists "store_credit_account_transaction" drop constraint if exists "store_credit_account_transaction_transaction_group_id_foreign";`)
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "store_credit_account_transaction" cascade;')
    this.addSql('drop table if exists "store_credit_account" cascade;')
    this.addSql('drop table if exists "loyalty_gift_card" cascade;')
  }
}
```

**Key Migration Principles:**
1. Use `create table if not exists` for all table creation
2. Use `add column if not exists` for column additions
3. Use `drop column if exists` for column removals
4. Use `CREATE INDEX IF NOT EXISTS` for all indexes
5. Use `drop index if exists` for index removals
6. Use `DO $$ ... EXCEPTION WHEN duplicate_object` for foreign key constraints
7. Use `alter column ... drop not null` which is safe to run multiple times
8. Tables keep the same names as the plugin (`loyalty_gift_card`, `store_credit_account`, `store_credit_account_transaction`) to ensure data continuity

### Success Criteria:

#### Automated Verification:
- [ ] Module builds: `yarn workspace @medusajs/loyalty build`
- [ ] Module tests pass: `yarn workspace @medusajs/loyalty test`

#### Manual Verification:
- [ ] Module can be loaded in a Medusa application

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Link Module Definitions

### Overview
Create link definitions to connect the Loyalty module with Cart, Order, Customer, and OrderLineItem modules.

### Changes Required:

#### 1. Cart-GiftCard Link (Many-to-Many)

**File**: `packages/modules/link-modules/src/definitions/cart-gift-card.ts`
```typescript
import { Modules } from "@medusajs/framework/utils"
import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { LINKS } from "@medusajs/framework/utils"

export const CartGiftCard: ModuleJoinerConfig = {
  serviceName: LINKS.CartGiftCard,
  isLink: true,
  databaseConfig: {
    tableName: "cart_gift_card",
    idPrefix: "cartgc",
  },
  alias: [
    { name: "cart_gift_card" },
    { name: "cart_gift_cards" },
  ],
  primaryKeys: ["id", "cart_id", "gift_card_id"],
  relationships: [
    {
      serviceName: Modules.CART,
      entity: "Cart",
      primaryKey: "id",
      foreignKey: "cart_id",
      alias: "cart",
      args: { methodSuffix: "Carts" },
      hasMany: true,
    },
    {
      serviceName: Modules.LOYALTY,
      entity: "GiftCard",
      primaryKey: "id",
      foreignKey: "gift_card_id",
      alias: "gift_card",
      args: { methodSuffix: "GiftCards" },
      hasMany: true,
    },
  ],
  extends: [
    {
      serviceName: Modules.CART,
      entity: "Cart",
      fieldAlias: {
        gift_cards: {
          path: "gift_cards_link.gift_card",
          isList: true,
        },
      },
      relationship: {
        serviceName: LINKS.CartGiftCard,
        primaryKey: "cart_id",
        foreignKey: "id",
        alias: "gift_cards_link",
        isList: true,
      },
    },
    {
      serviceName: Modules.LOYALTY,
      entity: "GiftCard",
      fieldAlias: {
        carts: {
          path: "carts_link.cart",
          isList: true,
        },
      },
      relationship: {
        serviceName: LINKS.CartGiftCard,
        primaryKey: "gift_card_id",
        foreignKey: "id",
        alias: "carts_link",
        isList: true,
      },
    },
  ],
}
```

#### 2. Order-GiftCard Link (Many-to-Many)

**File**: `packages/modules/link-modules/src/definitions/order-gift-card.ts`

Similar structure to cart-gift-card, linking Order to GiftCard.

#### 3. Customer-StoreCreditAccount Link (Read-Only)

**File**: `packages/modules/link-modules/src/definitions/readonly/customer-store-credit-account.ts`
```typescript
import { Modules } from "@medusajs/framework/utils"
import { ModuleJoinerConfig } from "@medusajs/framework/types"

export const CustomerStoreCreditAccount: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.LOYALTY,
      entity: "StoreCreditAccount",
      relationship: {
        serviceName: Modules.CUSTOMER,
        entity: "Customer",
        primaryKey: "id",
        foreignKey: "customer_id",
        alias: "customer",
        args: { methodSuffix: "Customers" },
      },
    },
    {
      serviceName: Modules.CUSTOMER,
      entity: "Customer",
      relationship: {
        serviceName: Modules.LOYALTY,
        entity: "StoreCreditAccount",
        primaryKey: "customer_id",
        foreignKey: "id",
        alias: "store_credit_accounts",
        args: { methodSuffix: "StoreCreditAccounts" },
        isList: true,
      },
    },
  ],
}
```

#### 4. GiftCard-OrderLineItem Link (Read-Only)

**File**: `packages/modules/link-modules/src/definitions/readonly/gift-card-order-line-item.ts`

Read-only link connecting GiftCard to OrderLineItem via `line_item_id`.

#### 5. Add LINKS Entries

**File**: `packages/core/utils/src/link/links.ts`
**Changes**: Add new link names

```typescript
// Add these to the LINKS object
CartGiftCard: composeLinkName(Modules.CART, "cart_id", Modules.LOYALTY, "gift_card_id"),
OrderGiftCard: composeLinkName(Modules.ORDER, "order_id", Modules.LOYALTY, "gift_card_id"),
```

#### 6. Export Links

**File**: `packages/modules/link-modules/src/definitions/index.ts`
**Changes**: Export the new link definitions

**File**: `packages/modules/link-modules/src/definitions/readonly/index.ts`
**Changes**: Export the new read-only link definitions

### Success Criteria:

#### Automated Verification:
- [ ] Link modules build: `yarn workspace @medusajs/link-modules build`
- [ ] No TypeScript errors

#### Manual Verification:
- [ ] Links can be queried via the Query API

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 4.

---

## Phase 4: Core Flows - Loyalty Workflows and Steps

### Overview
Create the loyalty-specific workflows and steps in core-flows, and integrate cart/order loyalty functionality into existing cart and order workflows.

### Changes Required:

#### 1. Create Loyalty Folder Structure

```
packages/core/core-flows/src/loyalty/
├── index.ts
├── steps/
│   ├── index.ts
│   ├── create-gift-cards.ts
│   ├── update-gift-cards.ts
│   ├── delete-gift-cards.ts
│   ├── validate-gift-card-balances.ts
│   ├── create-store-credit-accounts.ts
│   ├── credit-accounts.ts
│   └── debit-accounts.ts
└── workflows/
    ├── index.ts
    ├── create-gift-cards.ts
    ├── update-gift-cards.ts
    ├── delete-gift-cards.ts
    ├── claim-gift-card.ts
    ├── redeem-gift-card.ts
    ├── create-store-credit-accounts.ts
    ├── claim-store-credit-account.ts
    ├── credit-accounts.ts
    └── debit-accounts.ts
```

#### 2. Steps Implementation

Adapt the existing plugin steps to follow core-flows patterns:
- Use `createStep(stepId, async (input, { container }) => { ... }, compensationFn)`
- Return `StepResponse(result, compensationData)`
- Resolve module service from container: `container.resolve(Modules.LOYALTY)`

#### 3. Workflows Implementation

Adapt the existing plugin workflows to follow core-flows patterns:
- Use `createWorkflow(workflowId, (input: WorkflowData<T>) => { ... })`
- Return `WorkflowResponse(result, { hooks: [...] })`
- Define hooks where appropriate (e.g., `giftCardCreated`, `accountCredited`)

#### 4. Cart Integration Steps

**File**: `packages/core/core-flows/src/cart/steps/add-gift-card-to-cart.ts`
**File**: `packages/core/core-flows/src/cart/steps/remove-gift-card-from-cart.ts`
**File**: `packages/core/core-flows/src/cart/steps/add-store-credits-to-cart.ts`
**File**: `packages/core/core-flows/src/cart/steps/refresh-cart-gift-cards.ts`
**File**: `packages/core/core-flows/src/cart/steps/confirm-cart-credit-lines.ts`

#### 5. Cart Integration Workflows

**File**: `packages/core/core-flows/src/cart/workflows/add-gift-card-to-cart.ts`
**File**: `packages/core/core-flows/src/cart/workflows/remove-gift-card-from-cart.ts`
**File**: `packages/core/core-flows/src/cart/workflows/add-store-credits-to-cart.ts`
**File**: `packages/core/core-flows/src/cart/workflows/refresh-cart-gift-cards.ts`
**File**: `packages/core/core-flows/src/cart/workflows/confirm-cart-credit-lines.ts`

#### 6. Order Integration Steps

**File**: `packages/core/core-flows/src/order/steps/link-gift-cards-to-order.ts`
**File**: `packages/core/core-flows/src/order/steps/refund-credit-lines.ts`

#### 7. Order Integration Workflows

**File**: `packages/core/core-flows/src/order/workflows/link-gift-cards-to-order.ts`
**File**: `packages/core/core-flows/src/order/workflows/refund-credit-lines.ts`

#### 8. Integrate Hooks into Core Workflows

The plugin currently uses these hooks:
1. `completeCartWorkflow.hooks.beforePaymentAuthorization` - Confirms cart credit lines
2. `completeCartWorkflow.hooks.orderCreated` - Links gift cards to order
3. `refreshCartItemsWorkflow.hooks.beforeRefreshingPaymentCollection` - Refreshes cart gift cards
4. `createOrderCreditLinesWorkflow.hooks.creditLinesCreated` - Handles refund credit lines

These hooks need to be natively integrated into the core workflows by adding the loyalty steps directly into the workflow definitions.

**File**: `packages/core/core-flows/src/cart/workflows/complete-cart.ts`
**Changes**:
- Add `confirmCartCreditLinesStep` before payment authorization
- Add `linkGiftCardsToOrderStep` after order creation

**File**: `packages/core/core-flows/src/cart/workflows/refresh-cart-items.ts`
**Changes**:
- Add `refreshCartGiftCardsStep` before refreshing payment collection

**File**: `packages/core/core-flows/src/order/workflows/create-order-credit-lines.ts`
**Changes**:
- Add `refundCreditLinesStep` after credit lines are created

#### 9. Export from Index Files

**File**: `packages/core/core-flows/src/loyalty/index.ts`
```typescript
export * from "./steps"
export * from "./workflows"
```

**File**: `packages/core/core-flows/src/cart/steps/index.ts`
**Changes**: Add exports for loyalty-related cart steps

**File**: `packages/core/core-flows/src/cart/workflows/index.ts`
**Changes**: Add exports for loyalty-related cart workflows

**File**: `packages/core/core-flows/src/order/steps/index.ts`
**Changes**: Add exports for loyalty-related order steps

**File**: `packages/core/core-flows/src/order/workflows/index.ts`
**Changes**: Add exports for loyalty-related order workflows

**File**: `packages/core/core-flows/src/index.ts`
**Changes**: Add `export * from "./loyalty"`

### Success Criteria:

#### Automated Verification:
- [ ] Core flows build: `yarn workspace @medusajs/core-flows build`
- [ ] Core flows tests pass: `yarn workspace @medusajs/core-flows test`

#### Manual Verification:
- [ ] Workflows can be executed via API

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 5.

---

## Phase 5: API Routes (Backward Compatible)

### Overview
Create the loyalty API routes in the Medusa package. **IMPORTANT**: Routes MUST maintain the same paths as the plugin to avoid breaking changes for existing users.

### API Route Path Mapping (Plugin → Core)

| Plugin Path | Core Path | Notes |
|-------------|-----------|-------|
| `/admin/gift-cards` | `/admin/gift-cards` | **Same path** |
| `/admin/store-credit-accounts` | `/admin/store-credit-accounts` | **Same path** |
| `/store/gift-cards` | `/store/gift-cards` | **Same path** |
| `/store/store-credit-accounts` | `/store/store-credit-accounts` | **Same path** |
| `/store/carts/:id/gift-cards` | `/store/carts/:id/gift-cards` | **Same path** |
| `/store/carts/:id/store-credits` | `/store/carts/:id/store-credits` | **Same path** |

### Changes Required:

#### 1. Admin Gift Card Routes

```
packages/medusa/src/api/admin/gift-cards/
├── route.ts              # GET (list), POST (create)
├── [id]/
│   ├── route.ts          # GET, PUT, DELETE
│   └── orders/
│       └── route.ts      # GET (orders using this gift card)
├── middlewares.ts
├── validators.ts
└── query-config.ts
```

#### 2. Admin Store Credit Account Routes

```
packages/medusa/src/api/admin/store-credit-accounts/
├── route.ts              # GET (list), POST (create)
├── [id]/
│   ├── route.ts          # GET, PUT, DELETE
│   ├── credit/
│   │   └── route.ts      # POST (add credit)
│   └── transactions/
│       └── route.ts      # GET (list transactions)
├── middlewares.ts
├── validators.ts
└── query-config.ts
```

#### 3. Store Gift Card Routes

```
packages/medusa/src/api/store/gift-cards/
├── [idOrCode]/
│   └── route.ts          # GET (by ID or code)
├── middlewares.ts
├── validators.ts
└── query-config.ts
```

#### 4. Store Credit Account Routes

```
packages/medusa/src/api/store/store-credit-accounts/
├── route.ts              # GET (list customer's accounts), POST (create)
├── [id]/
│   └── route.ts          # GET
├── claim/
│   └── route.ts          # POST (claim by code)
├── middlewares.ts
├── validators.ts
└── query-config.ts
```

#### 5. Cart Gift Card and Store Credit Routes

These are added as sub-routes to the existing cart routes:

```
packages/medusa/src/api/store/carts/[id]/gift-cards/
└── route.ts              # POST (add gift card), DELETE (remove gift card)

packages/medusa/src/api/store/carts/[id]/store-credits/
└── route.ts              # POST (apply store credits)
```

#### 6. Route Implementations

Follow the existing route patterns:
- Use `AuthenticatedMedusaRequest` for admin routes
- Use `MedusaRequest` for store routes
- Resolve workflows from `req.scope`
- Use validators for request body/query validation
- Use query-config for field selection

### Success Criteria:

#### Automated Verification:
- [ ] Medusa package builds: `yarn workspace @medusajs/medusa build`
- [ ] No TypeScript errors in route files

#### Manual Verification:
- [ ] Routes are accessible via HTTP
- [ ] Authentication works correctly

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 6.

---

## Phase 6: Subscriber Migration

### Overview
Migrate the gift card creation subscriber to the core subscriber directory.

### Changes Required:

#### 1. Create Core Subscriber

**File**: `packages/medusa/src/subscribers/create-gift-cards-for-order.ts`
```typescript
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, OrderWorkflowEvents } from "@medusajs/framework/utils"
import { createGiftCardsWorkflow } from "@medusajs/core-flows"

export default async function createGiftCardsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    filters: { id: orderId },
    fields: [
      "id",
      "currency_code",
      "items.id",
      "items.subtotal",
      "items.quantity",
      "items.product.is_giftcard",
    ],
  })

  const giftCardLineItems = order.items.filter(
    (item) => !!item.product?.is_giftcard
  )

  if (giftCardLineItems.length === 0) {
    return
  }

  for (const giftCardLineItem of giftCardLineItems) {
    for (let i = 0; i < giftCardLineItem.quantity; i++) {
      const giftCardValue =
        giftCardLineItem.subtotal / giftCardLineItem.quantity

      await createGiftCardsWorkflow.run({
        input: [
          {
            value: giftCardValue,
            currency_code: order.currency_code,
            line_item_id: giftCardLineItem.id,
            reference: "order",
            reference_id: order.id,
          },
        ],
        container,
      })
    }
  }
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Medusa package builds with subscriber

#### Manual Verification:
- [ ] Gift cards are created when an order with gift card products is placed

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 7.

---

## Phase 7: Admin Dashboard Integration

### Overview
Integrate the loyalty management UI into the core admin dashboard. Routes are at the root level (not under `/loyalty`) to maintain URL consistency with the API routes.

### Changes Required:

#### 1. Create Route Structure

```
packages/admin/dashboard/src/routes/gift-cards/
├── page.tsx                    # List page
├── @create/
│   └── page.tsx                # Create modal
├── [id]/
│   ├── page.tsx                # Detail page
│   ├── @expiration/
│   │   └── page.tsx            # Edit expiration modal
│   └── @note/
│       └── page.tsx            # Edit note modal
├── components/
│   ├── gift-cards-table/       # Table component
│   └── gift-card-create-form/  # Form component
└── gift-card-products/
    ├── page.tsx                # Gift card products list
    ├── @create/
    │   └── page.tsx            # Create product modal
    └── [id]/
        ├── page.tsx            # Product detail
        ├── @edit/
        │   └── page.tsx        # Edit product modal
        ├── @denominations/
        │   └── page.tsx        # Manage denominations
        ├── media/
        │   └── page.tsx        # Product media
        ├── prices/
        │   └── page.tsx        # Pricing
        └── sales-channels/
            └── page.tsx        # Channel management

packages/admin/dashboard/src/routes/store-credit-accounts/
├── page.tsx                    # List page
├── @create/
│   └── page.tsx                # Create modal
├── [id]/
│   ├── page.tsx                # Detail page
│   └── @credit/
│       └── page.tsx            # Add credit modal
└── components/
    ├── store-credit-accounts-table/
    └── store-credit-account-create-form/
```

#### 2. Add React Query Hooks

**File**: `packages/admin/dashboard/src/hooks/api/loyalty.tsx`

Create hooks for:
- `useGiftCards`, `useGiftCard`, `useCreateGiftCard`, `useUpdateGiftCard`, `useDeleteGiftCard`
- `useStoreCreditAccounts`, `useStoreCreditAccount`, `useCreateStoreCreditAccount`, `useCreditStoreCreditAccount`

#### 3. Add Route Definitions

**File**: `packages/admin/dashboard/src/dashboard-app/routes/get-route.map.tsx`

Add route definitions for loyalty pages in the main layout section.

#### 4. Add Navigation Items

**File**: `packages/admin/dashboard/src/components/layout/main-layout/main-layout.tsx`

Add "Gift Cards" and "Store Credit" as top-level navigation items in the sidebar (similar to how Products, Orders, etc. are displayed).

Alternatively, add a "Loyalty" section with sub-items:
```typescript
{
  icon: GiftIcon, // or appropriate icon
  label: "Loyalty",
  items: [
    { label: "Gift Cards", to: "/gift-cards" },
    { label: "Store Credit", to: "/store-credit-accounts" },
  ],
}
```

#### 5. Adapt Plugin Components

The plugin has 70+ React components that need to be adapted to the core dashboard patterns:
- Replace widget/route injection patterns with direct route components
- Use existing dashboard components (`_DataTable`, `RouteFocusModal`, `RouteDrawer`, etc.)
- Follow existing data fetching patterns with React Query
- Use the existing SDK client from `lib/client`

### Success Criteria:

#### Automated Verification:
- [ ] Dashboard builds: `yarn workspace @medusajs/dashboard build`
- [ ] No TypeScript errors

#### Manual Verification:
- [ ] Loyalty navigation item appears in sidebar
- [ ] Gift cards list page loads and displays data
- [ ] Gift card create form works
- [ ] Gift card detail page shows all sections
- [ ] Store credit accounts list page loads
- [ ] Store credit account detail page shows transactions

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 8.

---

## Phase 8: Integration Tests

### Overview
Migrate and adapt the integration tests from the plugin to the monorepo test structure.

### Changes Required:

#### 1. Create Test Files

Tests are organized by feature (gift-cards, store-credit-accounts) rather than under a single "loyalty" folder:

```
integration-tests/http/__tests__/gift-cards/
├── admin/
│   └── gift-cards.spec.ts
└── store/
    └── gift-cards.spec.ts

integration-tests/http/__tests__/store-credit-accounts/
├── admin/
│   └── store-credit-accounts.spec.ts
└── store/
    ├── store-credit-accounts.spec.ts
    └── carts.spec.ts          # Tests for cart gift card/store credit operations
```

Alternatively, add to existing test files:
```
integration-tests/http/__tests__/carts/store/gift-cards.spec.ts
integration-tests/http/__tests__/carts/store/store-credits.spec.ts
integration-tests/http/__tests__/orders/store/gift-cards.spec.ts
```

#### 2. Adapt Test Structure

The existing plugin tests use a custom test setup. Adapt them to use the monorepo's integration test framework:
- Use `medusaIntegrationTestRunner` from `@medusajs/test-utils`
- Follow existing test patterns in `integration-tests/http/__tests__/`
- Use the test database setup and seeding utilities

#### 3. Test Coverage

Ensure tests cover:
- Gift card CRUD operations
- Gift card redemption flow
- Store credit account CRUD operations
- Account credit/debit operations
- Cart integration (adding gift cards, applying store credits)
- Order integration (gift card linking)

### Success Criteria:

#### Automated Verification:
- [ ] Gift card tests pass: `yarn test:integration:http --testPathPattern=gift-cards`
- [ ] Store credit tests pass: `yarn test:integration:http --testPathPattern=store-credit-accounts`

#### Manual Verification:
- [ ] All test scenarios pass
- [ ] No flaky tests

**Implementation Note**: After completing this phase, the migration is complete. Run full test suite to verify.

---

## Phase 9: Final Verification and Cleanup

### Overview
Final verification and cleanup tasks.

### Changes Required:

#### 1. Update Package Exports

Ensure `@medusajs/medusa` exports the loyalty module:

**File**: `packages/medusa/src/index.ts` or relevant export file

Add export for loyalty module:
```typescript
export { default as loyaltyModule } from "@medusajs/loyalty"
```

#### 2. Update Documentation (if needed)

- Ensure JSDoc comments are present on service methods
- Ensure API routes have appropriate documentation comments

#### 3. Run Full Test Suite

```bash
yarn build
yarn test
yarn test:integration:packages
yarn test:integration:http
yarn test:integration:modules
```

#### 4. Verify Admin Dashboard

- Start the admin dashboard in development mode
- Verify all loyalty pages work correctly
- Test gift card creation and management
- Test store credit account management

### Success Criteria:

#### Automated Verification:
- [ ] Full build succeeds: `yarn build`
- [ ] All tests pass: `yarn test`
- [ ] Package integration tests pass
- [ ] HTTP integration tests pass
- [ ] Module integration tests pass

#### Manual Verification:
- [ ] Admin dashboard displays and functions correctly
- [ ] Gift card flow works end-to-end (create → add to cart → checkout → use)
- [ ] Store credit flow works end-to-end (create account → credit → debit)
- [ ] Customer can view their store credit accounts

---

## Testing Strategy

### Unit Tests

Located in each package's `src/__tests__/` directory:
- Loyalty module service methods
- Workflow step logic
- Utility functions (code generation)

### Integration Tests

Located in `integration-tests/http/__tests__/gift-cards/` and `integration-tests/http/__tests__/store-credit-accounts/`:
- API endpoint testing
- Workflow execution testing
- Database interaction testing

### Manual Testing Steps

1. Create a gift card product in admin
2. Add gift card product to cart
3. Complete checkout
4. Verify gift card was created
5. Retrieve gift card by code
6. Add gift card to a new cart
7. Verify cart total is reduced
8. Complete checkout with gift card
9. Verify gift card balance was deducted

1. Create a store credit account for a customer
2. Add credit to the account
3. Verify balance is updated
4. Apply store credits to a cart
5. Complete checkout
6. Verify account was debited

## Performance Considerations

- Gift card balance calculation uses SQL aggregation for efficiency
- Store credit balance is calculated via database query, not application-level iteration
- Indexes are created on frequently queried fields (code, customer_id, currency_code)

## Migration Notes

### For Existing Plugin Users

Users migrating from the plugin to the core module have a **seamless upgrade path**:

1. **Remove the loyalty plugin** from their project dependencies
2. **Enable the Loyalty module** in medusa-config (it will be auto-enabled in future versions)
3. **Run migrations** - The idempotent migration handles all scenarios:
   - If tables already exist and are up to date: nothing changes
   - If tables exist but are missing columns: only missing columns/indexes are added
   - If tables don't exist: full schema is created
4. **Update import paths** in custom code:
   - Types: `@medusajs/loyalty-plugin/types` → `@medusajs/framework/types`
   - Workflows: `@medusajs/loyalty-plugin/workflows` → `@medusajs/core-flows`
5. **API routes remain the same** - No changes needed for frontend integrations

### API Route Backward Compatibility

All API routes maintain the exact same paths as the plugin:

| Feature | Admin Path | Store Path |
|---------|------------|------------|
| Gift Cards | `/admin/gift-cards` | `/store/gift-cards` |
| Store Credit Accounts | `/admin/store-credit-accounts` | `/store/store-credit-accounts` |
| Cart Gift Cards | - | `/store/carts/:id/gift-cards` |
| Cart Store Credits | - | `/store/carts/:id/store-credits` |

### Database Table Compatibility

Table names and structure remain the same as the plugin:
- `loyalty_gift_card` - Gift cards table
- `store_credit_account` - Store credit accounts table
- `store_credit_account_transaction` - Transactions table

**Existing data is preserved.** The migration only adds missing columns/indexes and removes deprecated ones.

### New Users

For new users who never used the plugin:
1. The Loyalty module can be enabled in medusa-config
2. Running migrations creates all tables fresh
3. All features are immediately available

## References

- Plugin source: `/Users/ters/Desktop/work/medusa/local-development/loyalty-plugin`
- Existing module patterns: `packages/modules/product`, `packages/modules/order`
- Core flows patterns: `packages/core/core-flows/src/cart`, `packages/core/core-flows/src/order`
- Link definitions: `packages/modules/link-modules/src/definitions`
- Admin dashboard: `packages/admin/dashboard/src`
