import { Migration } from '@mikro-orm/migrations';

export class Migration20251215113723 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rbac_role_policy" drop constraint if exists "rbac_role_policy_role_id_scope_id_unique";`);
    this.addSql(`alter table if exists "rbac_role_inheritance" drop constraint if exists "rbac_role_inheritance_role_id_inherited_role_id_unique";`);
    this.addSql(`alter table if exists "rbac_role" drop constraint if exists "rbac_role_name_unique";`);
    this.addSql(`alter table if exists "rbac_policy" drop constraint if exists "rbac_policy_key_unique";`);
    this.addSql(`create table if not exists "rbac_policy" ("id" text not null, "key" text not null, "resource" text not null, "operation" text not null, "name" text null, "description" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_policy_deleted_at" ON "rbac_policy" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_policy_key_unique" ON "rbac_policy" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_policy_resource" ON "rbac_policy" ("resource") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_policy_operation" ON "rbac_policy" ("operation") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_role" ("id" text not null, "name" text not null, "description" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_role_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_deleted_at" ON "rbac_role" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_role_name_unique" ON "rbac_role" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_role_inheritance" ("id" text not null, "role_id" text not null, "inherited_role_id" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_role_inheritance_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_inheritance_role_id" ON "rbac_role_inheritance" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_inheritance_inherited_role_id" ON "rbac_role_inheritance" ("inherited_role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_inheritance_deleted_at" ON "rbac_role_inheritance" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_role_inheritance_role_id_inherited_role_id_unique" ON "rbac_role_inheritance" ("role_id", "inherited_role_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rbac_role_policy" ("id" text not null, "role_id" text not null, "scope_id" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rbac_role_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_policy_role_id" ON "rbac_role_policy" ("role_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_policy_scope_id" ON "rbac_role_policy" ("scope_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rbac_role_policy_deleted_at" ON "rbac_role_policy" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_role_policy_role_id_scope_id_unique" ON "rbac_role_policy" ("role_id", "scope_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "rbac_role_inheritance" add constraint "rbac_role_inheritance_role_id_foreign" foreign key ("role_id") references "rbac_role" ("id") on update cascade;`);
    this.addSql(`alter table if exists "rbac_role_inheritance" add constraint "rbac_role_inheritance_inherited_role_id_foreign" foreign key ("inherited_role_id") references "rbac_role" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rbac_role_policy" add constraint "rbac_role_policy_role_id_foreign" foreign key ("role_id") references "rbac_role" ("id") on update cascade;`);
    this.addSql(`alter table if exists "rbac_role_policy" add constraint "rbac_role_policy_scope_id_foreign" foreign key ("scope_id") references "rbac_policy" ("id") on update cascade;`);
  }

}
