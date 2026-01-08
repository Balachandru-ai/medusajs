import { expectTypeOf } from "expect-type"
import { TextProperty } from "../properties/text"
import { TranslatableModifier } from "../properties/translatable"

describe("Text property", () => {
  test("create text property type", () => {
    const property = new TextProperty()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
        options: { searchable: false },
      },
      nullable: false,
      computed: false,
      indexes: [],
      relationships: [],
    })
  })

  test("mark text property as primary key", () => {
    const property = new TextProperty().primaryKey()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
        options: { searchable: false },
      },
      nullable: false,
      computed: false,
      indexes: [],
      relationships: [],
      primaryKey: true,
    })
  })

  test("should mark text property as translatable", () => {
    const property = new TextProperty().translatable()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(TranslatableModifier.isTranslatableModifier(property)).toBe(true)
    expect(property.parse("name")).toEqual({
      fieldName: "name",
      dataType: {
        name: "text",
        options: { searchable: false },
      },
      nullable: false,
      computed: false,
      translatable: true,
      indexes: [],
      relationships: [],
    })
  })

  test("should chain translatable with searchable", () => {
    const property = new TextProperty().searchable().translatable()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("name")).toEqual({
      fieldName: "name",
      dataType: {
        name: "text",
        options: { searchable: true },
      },
      nullable: false,
      computed: false,
      translatable: true,
      indexes: [],
      relationships: [],
    })
  })

  test("should chain translatable with nullable", () => {
    const property = new TextProperty().translatable().nullable()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string | null>()
    expect(property.parse("description")).toEqual({
      fieldName: "description",
      dataType: {
        name: "text",
        options: { searchable: false },
      },
      nullable: true,
      computed: false,
      translatable: true,
      indexes: [],
      relationships: [],
    })
  })

  test("should chain translatable with default", () => {
    const property = new TextProperty().default("Default Value").translatable()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("name")).toEqual({
      fieldName: "name",
      dataType: {
        name: "text",
        options: { searchable: false },
      },
      nullable: false,
      computed: false,
      translatable: true,
      defaultValue: "Default Value",
      indexes: [],
      relationships: [],
    })
  })

  describe("translatable modifier order independence", () => {
    test("should allow searchable before vs after translatable and produce same result", () => {
      const searchableThenTranslatable = new TextProperty()
        .searchable()
        .translatable()
      const translatableThenSearchable = new TextProperty()
        .translatable()
        .searchable()

      expect(searchableThenTranslatable.parse("name")).toEqual(
        translatableThenSearchable.parse("name")
      )
    })

    test("should allow default before vs after translatable and produce same result", () => {
      const defaultThenTranslatable = new TextProperty()
        .default("Default")
        .translatable()
      const translatableThenDefault = new TextProperty()
        .translatable()
        .default("Default")

      expect(defaultThenTranslatable.parse("name")).toEqual(
        translatableThenDefault.parse("name")
      )
    })

    test("should allow index before vs after translatable and produce same result", () => {
      const indexThenTranslatable = new TextProperty()
        .index("idx_name")
        .translatable()
      const translatableThenIndex = new TextProperty()
        .translatable()
        .index("idx_name")

      expect(indexThenTranslatable.parse("name")).toEqual(
        translatableThenIndex.parse("name")
      )
    })

    test("should allow unique before vs after translatable and produce same result", () => {
      const uniqueThenTranslatable = new TextProperty()
        .unique("unq_name")
        .translatable()
      const translatableThenUnique = new TextProperty()
        .translatable()
        .unique("unq_name")

      expect(uniqueThenTranslatable.parse("name")).toEqual(
        translatableThenUnique.parse("name")
      )
    })

    test("should allow complex chain order independence", () => {
      const order1 = new TextProperty()
        .searchable()
        .default("test")
        .index("idx_name")
        .translatable()
        .nullable()

      const order2 = new TextProperty()
        .translatable()
        .searchable()
        .default("test")
        .index("idx_name")
        .nullable()

      expect(order1.parse("name")).toEqual(order2.parse("name"))
    })
  })
})
