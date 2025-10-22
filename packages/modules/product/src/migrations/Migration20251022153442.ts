import { Migration } from "@mikro-orm/migrations"

export class Migration20251022153442 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_product_option" ("product_id" text not null, "product_option_id" text not null, constraint "product_product_option_pkey" primary key ("product_id", "product_option_id"));`
    )

    this.addSql(
      `alter table if exists "product_product_option" add constraint "product_product_option_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`
    )
    this.addSql(
      `alter table if exists "product_product_option" add constraint "product_product_option_product_option_id_foreign" foreign key ("product_option_id") references "product_option" ("id") on update cascade on delete cascade;`
    )

    // Add is_exclusive column before migrating data
    this.addSql(
      `alter table if exists "product_option" add column if not exists "is_exclusive" boolean not null default false;`
    )

    // Migrate existing product_id relationships to the join table
    this.addSql(
      `insert into "product_product_option" ("product_id", "product_option_id")
       select "product_id", "id" from "product_option" where "product_id" is not null;`
    )

    // Set is_exclusive to true for all existing options
    this.addSql(
      `update "product_option" set "is_exclusive" = true where "id" is not null;`
    )

    // Now drop the old product_id column and constraints
    this.addSql(
      `alter table if exists "product_option" drop constraint if exists "product_option_product_id_foreign";`
    )

    this.addSql(`drop index if exists "IDX_product_option_product_id";`)
    this.addSql(`drop index if exists "IDX_option_product_id_title_unique";`)
    this.addSql(
      `alter table if exists "product_option" drop column if exists "product_id";`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_product_option" cascade;`)

    this.addSql(
      `alter table if exists "product_option" drop column if exists "is_exclusive";`
    )

    this.addSql(
      `alter table if exists "product_option" add column if not exists "product_id" text not null;`
    )
    this.addSql(
      `alter table if exists "product_option" add constraint "product_option_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_option_product_id" ON "product_option" (product_id) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_option_product_id_title_unique" ON "product_option" (product_id, title) WHERE deleted_at IS NULL;`
    )
  }
}
