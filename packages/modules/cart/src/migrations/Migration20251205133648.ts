import { Migration } from '@mikro-orm/migrations';

export class Migration20251205133648 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cart" add column if not exists "locale_code" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "cart" drop column if exists "locale_code";`);
  }

}
