import { Migration } from '@mikro-orm/migrations';

export class Migration20251010123629 extends Migration {

  override async up(): Promise<void> {
    // 1. On `cart_line_item`
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_line_item_cart_id";'
    );

    // 2. On `cart_line_item_adjustment`
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_adjustment_item_id";'
    );

    // 3. On `cart_line_item_tax_line`
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_tax_line_item_id";'
    );
    
    // 4. On `cart_shipping_method`
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_shipping_method_cart_id";'
    );

    // 5. On `cart_shipping_method_adjustment`
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_adjustment_shipping_method_id";'
    );

    // 6. On `cart_shipping_method_tax_line`
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_tax_line_shipping_method_id";'
    );
  }

  override async down(): Promise<void> {
     // 1. On `cart_line_item`
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_line_item_cart_id" ON "cart_line_item" (cart_id) WHERE deleted_at IS NULL;'
    );

    // 2. On `cart_line_item_adjustment`
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_adjustment_item_id" ON "cart_line_item_adjustment" (item_id) WHERE deleted_at IS NULL;'
    );

    // 3. On `cart_line_item_tax_line`
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_tax_line_item_id" ON "cart_line_item_tax_line" (item_id) WHERE deleted_at IS NULL;'
    );

    // 4. On `cart_shipping_method`
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_shipping_method_cart_id" ON "cart_shipping_method" (cart_id) WHERE deleted_at IS NULL;'
    );

    // 5. On `cart_shipping_method_adjustment`
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_adjustment_shipping_method_id" ON "cart_shipping_method_adjustment" (shipping_method_id) WHERE deleted_at IS NULL;'
    );

    // 6. On `cart_shipping_method_tax_line`
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_tax_line_shipping_method_id" ON "cart_shipping_method_tax_line" (shipping_method_id) WHERE deleted_at IS NULL;'
    );
  }

}
