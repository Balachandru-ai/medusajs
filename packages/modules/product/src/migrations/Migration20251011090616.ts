import { Migration } from '@mikro-orm/migrations';

export class Migration20251011090616 extends Migration {
// UP: Adds the feature (the correct index on product_category).
  override async up(): Promise<void> {
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_product_category_deleted_at" ON "product_category" ("deleted_at");'
    );
  }

   // DOWN: Reverts the feature by dropping the index from product_category.
  override async down(): Promise<void> {
    this.addSql(
      'DROP INDEX IF EXISTS "IDX_product_category_deleted_at";'
    );
  }

}
