import { Constructor } from "@medusajs/types"
import { MikroORM, Utils } from "@mikro-orm/core"
import {
  Migrator as BaseMigrator,
  Migration,
  UmzugMigration,
} from "@mikro-orm/migrations"
import { getDefinedFileConfig, MEDUSA_SKIP_FILE } from "../../common"
import { dynamicImport } from "../../common/dynamic-import"

export class CustomDBMigrator extends BaseMigrator {
  static register(orm: MikroORM): void {
    orm.config.registerExtension(
      "@mikro-orm/migrator",
      () => new CustomDBMigrator(orm.em as any)
    )
  }

  resolve(params) {
    require(params.path)
    if (getDefinedFileConfig(params.path)) {
      if (getDefinedFileConfig(params.path).isDisabled()) {
        return {
          name: "Noop",
          up: () => {},
          down: () => {},
        } as any
      }
    }

    const $this = this as any
    const createMigrationHandler = async (method) => {
      const migration = await Utils.dynamicImport(params.path)
      const MigrationClass = Object.values(
        migration
      )[0] as Constructor<Migration>
      const instance = new MigrationClass($this.driver, $this.config)
      await $this.runner.run(instance, method)
    }

    return {
      name: $this.storage.getMigrationName(params.name),
      up: () => createMigrationHandler("up"),
      down: () => createMigrationHandler("down"),
    }
  }

  async getPendingMigrations(): Promise<UmzugMigration[]> {
    const pending = await super.getPendingMigrations()

    return pending.filter(async (pendingFile: UmzugMigration) => {
      const migration = await dynamicImport(pendingFile.path!)
      if (migration === MEDUSA_SKIP_FILE) {
        return false
      }

      return true
    })
  }
}
