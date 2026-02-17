import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20250217000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_stats" ("id" text not null, "product_id" text not null, "sale_count" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_stats_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_stats_deleted_at" ON "product_stats" (deleted_at) WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_stats" cascade;`)
  }
}
