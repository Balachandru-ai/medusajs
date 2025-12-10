import { Migration } from "@mikro-orm/migrations"

export class Migration20251210120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "order" ADD COLUMN IF NOT EXISTS "locale" text NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "order" DROP COLUMN IF EXISTS "locale";`)
  }
}
