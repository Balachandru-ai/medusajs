import { Migration } from '@mikro-orm/migrations';

export class Migration20251010125912 extends Migration {
  override async up(): Promise<void> {
    //  less descriptive index on order_item.
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_order_item_version";'
    );

    //  less descriptive index on order_shipping.
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_order_shipping_version";'
    );

    
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_order_shipping_item_id";'
    );
  }

  override async down(): Promise<void> {
   
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_order_item_version" ON "order_item" (version) WHERE deleted_at IS NULL;'
    );

    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_order_shipping_version" ON "order_shipping" (version) WHERE deleted_at IS NULL;'
    );

    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_order_shipping_item_id" ON "order_shipping" (shipping_method_id) WHERE deleted_at IS NULL;'
    );
  }
}
