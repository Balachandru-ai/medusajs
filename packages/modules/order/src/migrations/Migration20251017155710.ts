import { Migration } from "@mikro-orm/migrations"

export class Migration20251017155710 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop index if exists "IDX_order_item_version";`)

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_item_order_id_version" ON "order_item" (order_id, version) WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      WITH latest_order_item_version AS (
        SELECT
          oli.id AS item_id,
          MAX(oi.version) AS version
        FROM "order_line_item" oli
        INNER JOIN "order_item" oi
          ON oi.item_id = oli.id
          AND oi.deleted_at IS NULL
        GROUP BY oli.id
      )
      UPDATE "order_line_item_adjustment" olia
      SET version = latest_order_item_version.version
      FROM latest_order_item_version
      WHERE olia.item_id = latest_order_item_version.item_id
        AND olia.version <> latest_order_item_version.version;
    `)

    this.addSql(`drop index if exists "IDX_order_shipping_version";`)

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_shipping_order_id_version" ON "order_shipping" (order_id, version) WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_order_item_order_id_version";`)

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_item_version" ON "order_item" (order_id, version) WHERE deleted_at IS NULL;`
    )

    this.addSql(`drop index if exists "IDX_order_shipping_order_id_version";`)

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_shipping_version" ON "order_shipping" (order_id, version) WHERE deleted_at IS NULL;`
    )
  }
}
