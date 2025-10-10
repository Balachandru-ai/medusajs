import { Migration } from '@mikro-orm/migrations';

export class Migration20251010125912 extends Migration {

  override async up(): Promise<void> {
     // 1. On `order_item`: Drops the old composite index.
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_order_item_order_id_version";'
    );

    // 2. On `order_shipping`: Drops the old composite index.
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_order_shipping_order_id_version";'
    );

    // 3. On `order_shipping`: Drops the misnamed index. It was named `..._item_id` but was created on `shipping_method_id`.
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_order_shipping_item_id";'
    );
  }

  override async down(): Promise<void> {
    // 1. On `order_item`: Re-creates the old composite index.
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_order_item_order_id_version" ON "order_item" (order_id, version) WHERE deleted_at IS NULL;'
    );

    // 2. On `order_shipping`: Re-creates the old composite index.
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_order_shipping_order_id_version" ON "order_shipping" (order_id, version) WHERE deleted_at IS NULL;'
    );

    // 3. On `order_shipping`: Re-creates the misnamed index with its original (incorrect) definition.
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_order_shipping_item_id" ON "order_shipping" (shipping_method_id) WHERE deleted_at IS NULL;'
    );
  }

}
