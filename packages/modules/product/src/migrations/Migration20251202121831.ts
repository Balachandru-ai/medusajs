import { Migration } from '@mikro-orm/migrations';

export class Migration20251202121831 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_image_product_id" ON "image" ("product_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_variant_product_image" drop column if exists "created_by", drop column if exists "metadata";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_product_image_product_id";`);

    this.addSql(`alter table if exists "product_variant_product_image" add column if not exists "created_by" text null, add column if not exists "metadata" jsonb null;`);
  }

}
