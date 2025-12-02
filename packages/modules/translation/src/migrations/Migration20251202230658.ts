import { Migration } from '@mikro-orm/migrations';

export class Migration20251202230658 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "locale" drop constraint if exists "locale_pkey";`);
    this.addSql(`alter table if exists "locale" drop column if exists "id";`);

    this.addSql(`alter table if exists "locale" add constraint "locale_pkey" primary key ("code");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "locale" drop constraint if exists "locale_pkey";`);

    this.addSql(`alter table if exists "locale" add column if not exists "id" text not null;`);
    this.addSql(`alter table if exists "locale" add constraint "locale_pkey" primary key ("id");`);
  }

}
