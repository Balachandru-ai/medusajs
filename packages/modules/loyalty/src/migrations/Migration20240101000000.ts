import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// TODO: review this
/**
 * Idempotent migration for the Loyalty module.
 *
 * This migration is designed to work for:
 * - **Existing plugin users (up to date)**: Tables already exist, nothing changes
 * - **Existing plugin users (not up to date)**: Only missing columns/indexes are added
 * - **New users**: All tables and indexes are created fresh
 *
 * All statements use idempotent patterns (IF NOT EXISTS, IF EXISTS, etc.)
 * to ensure the migration can be run safely on any database state.
 */
export class Migration20240101000000 extends Migration {
  async up(): Promise<void> {
    // ============================================
    // GIFT CARD TABLE
    // ============================================

    // Create table if it doesn't exist (for new users)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "loyalty_gift_card" (
        "id" text NOT NULL,
        "status" text CHECK ("status" IN ('pending', 'active', 'redeemed', 'disabled', 'expired')) NOT NULL DEFAULT 'pending',
        "value" numeric NOT NULL,
        "balance" numeric NOT NULL,
        "code" text NOT NULL,
        "currency_code" text NOT NULL,
        "expires_at" timestamptz NULL,
        "reference_id" text NULL,
        "reference" text NULL,
        "line_item_id" text NULL,
        "note" text NULL,
        "metadata" jsonb NULL,
        "raw_value" jsonb NOT NULL,
        "raw_balance" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "loyalty_gift_card_pkey" PRIMARY KEY ("id")
      );
    `)

    // Add columns that may be missing for existing plugin users not fully up to date
    this.addSql(
      `ALTER TABLE IF EXISTS "loyalty_gift_card" ADD COLUMN IF NOT EXISTS "balance" numeric;`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "loyalty_gift_card" ADD COLUMN IF NOT EXISTS "raw_balance" jsonb;`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "loyalty_gift_card" ADD COLUMN IF NOT EXISTS "reference_id" text NULL;`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "loyalty_gift_card" ADD COLUMN IF NOT EXISTS "reference" text NULL;`
    )

    // Create indexes (IF NOT EXISTS makes these idempotent)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_loyalty_gift_card_code_unique" ON "loyalty_gift_card" (code) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_loyalty_gift_card_deleted_at" ON "loyalty_gift_card" (deleted_at) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_loyalty_gift_card_currency_code" ON "loyalty_gift_card" (currency_code) WHERE deleted_at IS NULL;`
    )

    // Drop old columns/indexes that were removed in plugin updates (idempotent)
    this.addSql(
      `ALTER TABLE IF EXISTS "loyalty_gift_card" DROP COLUMN IF EXISTS "customer_id";`
    )
    this.addSql(`DROP INDEX IF EXISTS "IDX_line_item_id_customer_id";`)

    // Drop the invitation table if it exists (was removed in later plugin versions)
    this.addSql(`DROP TABLE IF EXISTS "loyalty_gift_card_invitation" CASCADE;`)

    // ============================================
    // STORE CREDIT ACCOUNT TABLE
    // ============================================

    // Create table if it doesn't exist
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "store_credit_account" (
        "id" text NOT NULL,
        "code" text NULL,
        "currency_code" text NOT NULL,
        "customer_id" text NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "store_credit_account_pkey" PRIMARY KEY ("id")
      );
    `)

    // Add columns that may be missing
    this.addSql(
      `ALTER TABLE IF EXISTS "store_credit_account" ADD COLUMN IF NOT EXISTS "code" text NULL;`
    )

    // Update customer_id to be nullable (for unclaimed accounts)
    // This is safe to run multiple times
    this.addSql(
      `ALTER TABLE IF EXISTS "store_credit_account" ALTER COLUMN "customer_id" DROP NOT NULL;`
    )

    // Create indexes
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_credit_account_deleted_at" ON "store_credit_account" (deleted_at) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_loyalty_customer_id_currency_code" ON "store_credit_account" (customer_id, currency_code) WHERE customer_id IS NOT NULL AND deleted_at IS NULL;`
    )

    // Drop old transaction group table if it exists (was removed in later plugin versions)
    this.addSql(
      `DROP TABLE IF EXISTS "store_credit_transaction_group" CASCADE;`
    )

    // ============================================
    // ACCOUNT TRANSACTION TABLE
    // ============================================

    // Create table if it doesn't exist
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "store_credit_account_transaction" (
        "id" text NOT NULL,
        "amount" numeric NOT NULL,
        "type" text CHECK ("type" IN ('credit', 'debit')) NOT NULL,
        "reference" text NOT NULL,
        "reference_id" text NOT NULL,
        "note" text NULL,
        "account_id" text NOT NULL,
        "metadata" jsonb NULL,
        "raw_amount" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "store_credit_account_transaction_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create indexes
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_credit_account_transaction_account_id" ON "store_credit_account_transaction" (account_id);`
    )

    // Add foreign key if it doesn't exist (idempotent via exception handling)
    this.addSql(`
      DO $$ BEGIN
        ALTER TABLE "store_credit_account_transaction"
        ADD CONSTRAINT "store_credit_account_transaction_account_id_foreign"
        FOREIGN KEY ("account_id") REFERENCES "store_credit_account" ("id") ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)

    // Drop old columns that were removed
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_store_credit_account_transaction_transaction_group_id";`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "store_credit_account_transaction" DROP COLUMN IF EXISTS "transaction_group_id";`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "store_credit_account_transaction" DROP CONSTRAINT IF EXISTS "store_credit_account_transaction_transaction_group_id_foreign";`
    )
  }

  async down(): Promise<void> {
    this.addSql(
      'DROP TABLE IF EXISTS "store_credit_account_transaction" CASCADE;'
    )
    this.addSql('DROP TABLE IF EXISTS "store_credit_account" CASCADE;')
    this.addSql('DROP TABLE IF EXISTS "loyalty_gift_card" CASCADE;')
  }
}
