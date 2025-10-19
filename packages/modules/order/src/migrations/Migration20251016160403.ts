import { Migration } from '@mikro-orm/migrations';

export class Migration20251016160403 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "order_line_item_adjustment" add column if not exists "version" integer not null default 1;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "order_line_item_adjustment" drop column if exists "version";`);
  }

}
