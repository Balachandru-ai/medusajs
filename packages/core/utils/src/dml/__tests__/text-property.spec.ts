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
})
