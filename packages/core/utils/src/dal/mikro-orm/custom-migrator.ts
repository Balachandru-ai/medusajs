import { MikroORM } from "@mikro-orm/core"
import { Migrator as BaseMigrator, UmzugMigration } from "@mikro-orm/migrations"
import { MEDUSA_SKIP_FILE } from "../../common"
import { dynamicImport } from "../../common/dynamic-import"

export class CustomMigrator extends BaseMigrator {
  static register(orm: MikroORM): void {
    orm.config.registerExtension(
      "@mikro-orm/migrator",
      () => new CustomMigrator(orm.em as any)
    )
  }

  async getPendingMigrations(): Promise<UmzugMigration[]> {
    const pending = await super.getPendingMigrations()

    // Filter out migrations that are disabled by file config
    return pending.filter(async (pendingFile: UmzugMigration) => {
      const migration = await dynamicImport(pendingFile.path!)
      if (migration === MEDUSA_SKIP_FILE) {
        return false
      }

      return true
    })
  }
}
