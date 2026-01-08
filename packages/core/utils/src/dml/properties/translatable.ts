import { PropertyMetadata, PropertyType } from "@medusajs/types"
import { ComputedProperty } from "./computed"
import { NullableModifier } from "./nullable"

const IsTranslatableModifier = Symbol.for("isTranslatableModifier")

/**
 * Translatable modifier marks a schema node as translatable.
 * This modifier can only be applied to text properties.
 */
export class TranslatableModifier<T, Schema extends PropertyType<T>>
  implements PropertyType<T>
{
  [IsTranslatableModifier]: true = true

  /**
   * Defined indexes and relationships
   */
  #indexes: PropertyMetadata["indexes"] = []

  /**
   * Default value for the property
   */
  #defaultValue?: T

  /**
   * Whether the property is searchable
   */
  #searchable: boolean = false

  static isTranslatableModifier(
    obj: any
  ): obj is TranslatableModifier<any, any> {
    return !!obj?.[IsTranslatableModifier]
  }

  /**
   * A type-only property to infer the JavaScript data-type
   * of the schema property
   */
  declare $dataType: T

  /**
   * The parent schema on which the translatable modifier is
   * applied
   */
  #schema: Schema

  constructor(schema: Schema) {
    this.#schema = schema
  }

  /**
   * This method indicates that a translatable property is nullable.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const Store = model.define("store", {
   *   name: model.text().translatable().nullable(),
   *   // ...
   * })
   *
   * export default Store
   *
   * @customNamespace Property Configuration Methods
   */
  nullable() {
    return new NullableModifier<T, this>(this)
  }

  /**
   * This method defines an index on a property.
   *
   * @param {string} name - The index's name. If not provided,
   * Medusa generates the name.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const MyCustom = model.define("my_custom", {
   *   id: model.id(),
   *   name: model.text().index(
   *     "IDX_MY_CUSTOM_NAME"
   *   ),
   * })
   *
   * export default MyCustom
   *
   * @customNamespace Property Configuration Methods
   */
  index(name?: string) {
    this.#indexes.push({ name, type: "index" })
    return this
  }

  /**
   * This method indicates that a property's value must be unique in the database.
   * A unique index is created on the property.
   *
   * @param {string} name - The unique index's name. If not provided,
   * Medusa generates the name.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const User = model.define("user", {
   *   email: model.text().unique(),
   *   // ...
   * })
   *
   * export default User
   *
   * @customNamespace Property Configuration Methods
   */
  unique(name?: string) {
    this.#indexes.push({ name, type: "unique" })
    return this
  }

  /**
   * This method defines the default value of a property.
   *
   * @param {T} value - The default value.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const MyCustom = model.define("my_custom", {
   *   color: model
   *     .enum(["black", "white"])
   *     .default("black"),
   *   age: model
   *     .number()
   *     .default(0),
   *   // ...
   * })
   *
   * export default MyCustom
   *
   * @customNamespace Property Configuration Methods
   */
  default(value: T) {
    this.#defaultValue = value
    return this
  }

  /**
   * This method indicates that the property is searchable.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const Store = model.define("store", {
   *   name: model.text().translatable().searchable(),
   *   // ...
   * })
   *
   * export default Store
   *
   * @customNamespace Property Configuration Methods
   */
  searchable() {
    this.#searchable = true
    return this
  }

  /**
   * This method indicates that the property is computed.
   * Computed properties are not stored in the database.
   *
   * @customNamespace Property Configuration Methods
   */
  computed() {
    return new ComputedProperty<T | null, this>(this)
  }

  /**
   * Returns the serialized metadata
   */
  parse(fieldName: string) {
    const schema = this.#schema.parse(fieldName)
    schema.translatable = true

    // Merge indexes from parent schema and this modifier
    const mergedIndexes = [...schema.indexes, ...this.#indexes]

    // Apply searchable if set on this modifier
    if (this.#searchable && schema.dataType.options) {
      schema.dataType.options.searchable = true
    }

    return {
      ...schema,
      indexes: mergedIndexes,
      defaultValue: this.#defaultValue ?? schema.defaultValue,
    }
  }
}
