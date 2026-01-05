import { z } from "zod"
import { FormFieldType } from "./types"

export function getFieldLabel(name: string, label?: string) {
  if (label) {
    return label
  }

  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function getFieldType(type: z.ZodType): FormFieldType {
  const schemaType = type.type

  if (schemaType === "string") {
    return "text"
  }

  if (schemaType === "number") {
    return "number"
  }

  if (schemaType === "boolean") {
    return "boolean"
  }

  if (schemaType === "nullable" || schemaType === "optional") {
    const innerType = (
      type as z.ZodNullable<z.ZodType> | z.ZodOptional<z.ZodType>
    ).unwrap()
    return getFieldType(innerType)
  }

  if (schemaType === "pipe") {
    const innerType = (type._zod.def as unknown as { in: z.ZodType }).in
    return getFieldType(innerType)
  }

  return "unsupported"
}

export function getIsFieldOptional(type: z.ZodType) {
  const schemaType = type.type
  return (
    schemaType === "optional" ||
    schemaType === "null" ||
    schemaType === "undefined" ||
    schemaType === "nullable"
  )
}
