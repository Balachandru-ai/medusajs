import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260106185528 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_order_line_item_adjustment_version_item" ON "order_line_item_adjustment" ("version", "item_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "order_shipping_method_adjustment" add column if not exists "version" integer not null default 1;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_order_shipping_method_adjustment_version_shipping_method" ON "order_shipping_method_adjustment" ("version", "shipping_method_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_order_line_item_adjustment_version_item";`);

    this.addSql(`drop index if exists "IDX_order_shipping_method_adjustment_version_shipping_method";`);
    this.addSql(`alter table if exists "order_shipping_method_adjustment" drop column if exists "version";`);
  }

}
