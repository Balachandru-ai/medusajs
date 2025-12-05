import { Migration } from '@mikro-orm/migrations';

export class Migration20251205200245 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "translation" drop constraint if exists "translation_reference_id_locale_code_unique";`);
    this.addSql(`drop index if exists "IDX_translation_entity_id_locale_code_unique";`);
    this.addSql(`drop index if exists "IDX_translation_entity_id_entity_type";`);
    this.addSql(`alter table if exists "translation" drop column if exists "entity_id", drop column if exists "entity_type";`);

    this.addSql(`alter table if exists "translation" add column if not exists "reference_id" text not null, add column if not exists "reference" text not null;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_translation_reference_id_locale_code_unique" ON "translation" ("reference_id", "locale_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_translation_reference_id_reference" ON "translation" ("reference_id", "reference") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_translation_reference_id_locale_code_unique";`);
    this.addSql(`drop index if exists "IDX_translation_reference_id_reference";`);
    this.addSql(`alter table if exists "translation" drop column if exists "reference_id", drop column if exists "reference";`);

    this.addSql(`alter table if exists "translation" add column if not exists "entity_id" text not null, add column if not exists "entity_type" text not null;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_translation_entity_id_locale_code_unique" ON "translation" ("entity_id", "locale_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_translation_entity_id_entity_type" ON "translation" ("entity_id", "entity_type") WHERE deleted_at IS NULL;`);
  }

}
