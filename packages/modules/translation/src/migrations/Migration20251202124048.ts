import { Migration } from "@mikro-orm/migrations"

export class Migration20251202124048 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "translation" drop constraint if exists "translation_entity_id_entity_type_locale_code_unique";`
    )
    this.addSql(
      `create table if not exists "locale" ("id" text not null, "code" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "locale_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_locale_deleted_at" ON "locale" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "translation" ("id" text not null, "entity_id" text not null, "entity_type" text not null, "locale_code" text not null, "translations" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "translation_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_translation_deleted_at" ON "translation" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_translation_entity_id_entity_type_locale_code_unique" ON "translation" ("entity_id", "entity_type", "locale_code") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_translation_entity_id_entity_type" ON "translation" ("entity_id", "entity_type") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_translation_locale_code" ON "translation" ("locale_code") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "locale" cascade;`)

    this.addSql(`drop table if exists "translation" cascade;`)
  }
}
