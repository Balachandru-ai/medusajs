import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260213212102 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product" add column if not exists "raw_weight" jsonb null, add column if not exists "raw_length" jsonb null, add column if not exists "raw_height" jsonb null, add column if not exists "raw_width" jsonb null;`);
    this.addSql(`alter table if exists "product" alter column "weight" type numeric using ("weight"::numeric);`);
    this.addSql(`alter table if exists "product" alter column "length" type numeric using ("length"::numeric);`);
    this.addSql(`alter table if exists "product" alter column "height" type numeric using ("height"::numeric);`);
    this.addSql(`alter table if exists "product" alter column "width" type numeric using ("width"::numeric);`);

    this.addSql(`alter table if exists "product_variant" add column if not exists "raw_weight" jsonb null, add column if not exists "raw_length" jsonb null, add column if not exists "raw_height" jsonb null, add column if not exists "raw_width" jsonb null;`);
    this.addSql(`alter table if exists "product_variant" alter column "weight" type numeric using ("weight"::numeric);`);
    this.addSql(`alter table if exists "product_variant" alter column "length" type numeric using ("length"::numeric);`);
    this.addSql(`alter table if exists "product_variant" alter column "height" type numeric using ("height"::numeric);`);
    this.addSql(`alter table if exists "product_variant" alter column "width" type numeric using ("width"::numeric);`);

    this.addSql(`alter table if exists "product_variant_product_image" drop column if exists "created_by", drop column if exists "metadata";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product" drop column if exists "raw_weight", drop column if exists "raw_length", drop column if exists "raw_height", drop column if exists "raw_width";`);

    this.addSql(`alter table if exists "product" alter column "weight" type text using ("weight"::text);`);
    this.addSql(`alter table if exists "product" alter column "length" type text using ("length"::text);`);
    this.addSql(`alter table if exists "product" alter column "height" type text using ("height"::text);`);
    this.addSql(`alter table if exists "product" alter column "width" type text using ("width"::text);`);

    this.addSql(`alter table if exists "product_variant" drop column if exists "raw_weight", drop column if exists "raw_length", drop column if exists "raw_height", drop column if exists "raw_width";`);

    this.addSql(`alter table if exists "product_variant" alter column "weight" type integer using ("weight"::integer);`);
    this.addSql(`alter table if exists "product_variant" alter column "length" type integer using ("length"::integer);`);
    this.addSql(`alter table if exists "product_variant" alter column "height" type integer using ("height"::integer);`);
    this.addSql(`alter table if exists "product_variant" alter column "width" type integer using ("width"::integer);`);

    this.addSql(`alter table if exists "product_variant_product_image" add column if not exists "created_by" text null, add column if not exists "metadata" jsonb null;`);
  }

}
