import {
  Collection,
  Entity,
  ManyToMany,
  MetadataStorage,
  MikroORM,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
} from "@mikro-orm/core"
import { defineConfig } from "@mikro-orm/postgresql"
import { createDatabase, dropDatabase } from "pg-god"
import { CustomTsMigrationGenerator } from "../../../dal"
import { mikroORMEntityBuilder } from "../../helpers/create-mikro-orm-entity"
import { pgGodCredentials } from "../utils"
import { join } from "path"
import { FileSystem } from "../../../common"

export const fileSystem = new FileSystem(
  join(
    __dirname,
    "../../integration-tests-migrations-has-one-belongs-to-reproduction-issue"
  )
)

@Entity()
export class User {
  @PrimaryKey()
  id: string

  @Property()
  name: string

  @OneToOne({ entity: "Team", mappedBy: "user" })
  team: Ref<Team>

  @ManyToMany({
    entity: "Rules",
    mappedBy: "users",
    pivotTable: "user_rules",
  })
  rules = new Collection<Rules>(this)
}

@Entity()
export class Team {
  @PrimaryKey()
  id: string

  @Property()
  name: string

  @OneToOne({ entity: "User", mappedBy: "team" })
  user: User
}

@Entity()
export class Rules {
  @PrimaryKey()
  id: string

  @Property()
  name: string

  @ManyToMany({ entity: "User", mappedBy: "rules" })
  users = new Collection<User>(this)
}

describe("hasOne - belongTo", () => {
  const dbName = "EntityBuilder-HasOneBelongsTo"

  let orm!: MikroORM

  afterAll(async () => {
    await fileSystem.cleanup()
  })

  beforeEach(async () => {
    MetadataStorage.clear()
    mikroORMEntityBuilder.clear()

    await createDatabase({ databaseName: dbName }, pgGodCredentials)

    orm = await MikroORM.init(
      defineConfig({
        entities: [Team, User, Rules],
        tsNode: true,
        dbName,
        password: pgGodCredentials.password,
        host: pgGodCredentials.host,
        user: pgGodCredentials.user,
        migrations: {
          generator: CustomTsMigrationGenerator,
          path: fileSystem.basePath,
        },
      })
    )

    const migrator = orm.getMigrator()
    await migrator.createMigration()
    await migrator.up()
  })

  afterEach(async () => {
    await orm.close()

    await dropDatabase(
      { databaseName: dbName, errorIfNonExist: false },
      pgGodCredentials
    )
  })

  it("test", () => {
    expect(true).toBe(true)
  })
})
