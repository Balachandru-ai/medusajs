import { Migration } from '@mikro-orm/migrations';

export class Migration20251023160239 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_options" ("product_id" text not null, "product_option_id" text not null, constraint "product_options_pkey" primary key ("product_id", "product_option_id"));`);

    this.addSql(`alter table if exists "product_options" add constraint "product_options_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_options" add constraint "product_options_product_option_id_foreign" foreign key ("product_option_id") references "product_option" ("id") on update cascade on delete cascade;`);

    this.addSql(`drop table if exists "product_product_option" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "product_product_option" ("product_id" text not null, "product_option_id" text not null, constraint "product_product_option_pkey" primary key ("product_id", "product_option_id"));`);

    this.addSql(`alter table if exists "product_product_option" add constraint "product_product_option_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_product_option" add constraint "product_product_option_product_option_id_foreign" foreign key ("product_option_id") references "product_option" ("id") on update cascade on delete cascade;`);

    this.addSql(`drop table if exists "product_options" cascade;`);
  }

}
