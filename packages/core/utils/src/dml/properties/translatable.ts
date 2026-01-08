import { PropertyType } from "@medusajs/types"
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
   * Returns the serialized metadata
   */
  parse(fieldName: string) {
    const schema = this.#schema.parse(fieldName)
    schema.translatable = true
    return schema
  }
}
