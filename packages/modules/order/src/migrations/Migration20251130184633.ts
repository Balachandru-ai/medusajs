import { Migration } from '@mikro-orm/migrations';

export class Migration20251130184633 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_unique_order_item_version_item_id" ON "order_item" ("version", "item_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_unique_order_item_version_item_id";`);
  }

}
