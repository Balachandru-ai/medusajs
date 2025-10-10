import { Migration } from '@mikro-orm/migrations';

export class Migration20251010120726 extends Migration {

  override async up(): Promise<void> {
    this.addSql(
      `drop index if exists "IDX_product_category_deleted_at";`
    );
    this.addSql(
      'create index if not exists "IDX_product_category_deleted_at" on "product_category" ("deleted_at");'
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop index if exists "IDX_product_category_deleted_at";`
    );
    this.addSql(
      'create index if not exists "IDX_product_category_deleted_at" on "product_collection" ("deleted_at");'
    );
  }

}
