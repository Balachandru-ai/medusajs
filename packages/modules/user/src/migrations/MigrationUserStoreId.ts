import { Migration } from "@mikro-orm/migrations"

export class MigrationUserStoreId extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table "user" add column if not exists "store_id" text null;')
    this.addSql('create index if not exists "IDX_user_store_id" on "user" ("store_id") where deleted_at is null;')
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_user_store_id";')
    this.addSql('alter table "user" drop column if exists "store_id";')
  }
}
