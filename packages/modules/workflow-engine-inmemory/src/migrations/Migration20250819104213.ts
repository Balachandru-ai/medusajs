import { Migration } from "@mikro-orm/migrations"

export class Migration20250819104213 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_workflow_execution_run_id" ON "workflow_execution" (run_id) WHERE deleted_at IS NULL;`
    )

    this
      .addSql(`CREATE EXTENSION IF NOT EXISTS pgcrypto; -- required for gen_random_uuid()
`)
    this.addSql(
      `ALTER TABLE "workflow_execution" ALTER COLUMN "id" SET DEFAULT 'wf_exec_' || encode(gen_random_bytes(6), 'hex');`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_workflow_execution_run_id";`)
  }
}
