import { Migration } from "@mikro-orm/migrations"

export class MigrationTenantFields extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table "store" add column if not exists "subdomain" text null;')
    this.addSql('alter table "store" add column if not exists "primary_color" text null;')
    this.addSql('alter table "store" add column if not exists "logo_url" text null;')
    this.addSql('create unique index if not exists "IDX_store_subdomain" on "store" ("subdomain") where deleted_at is null;')
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_store_subdomain";')
    this.addSql('alter table "store" drop column if exists "subdomain";')
    this.addSql('alter table "store" drop column if exists "primary_color";')
    this.addSql('alter table "store" drop column if exists "logo_url";')
  }
}
