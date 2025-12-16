import { z, ZodError } from "zod"
import { MedusaError } from "../utils"

type ZodIssue = z.core.$ZodIssue
type ZodIssueInvalidType = z.core.$ZodIssueInvalidType
type ZodIssueInvalidUnion = z.core.$ZodIssueInvalidUnion
type ZodIssueInvalidValue = z.core.$ZodIssueInvalidValue

const formatPath = (issue: ZodIssue) => {
  return issue.path.join(", ")
}

const formatInvalidType = (issues: ZodIssue[]) => {
  const expected = issues
    .map((i) => {
      // In Zod v4, we detect required fields by checking if input is undefined
      // A wrong type error has a non-undefined input value
      if (i?.code === "invalid_type") {
        const invalidTypeIssue = i as ZodIssueInvalidType
        if (invalidTypeIssue.input !== undefined) {
          return invalidTypeIssue.expected
        }
      }
      return
    })
    .filter(Boolean)

  if (!expected.length) {
    return
  }

  const received = (issues?.[0] as ZodIssueInvalidType)?.input

  return `Expected type: '${expected.join(", ")}' for field '${formatPath(
    issues[0]
  )}', got: '${received}'`
}

const formatRequiredField = (issues: ZodIssue[]) => {
  const expected = issues
    .filter((i) => i != null)
    .map((i) => {
      // In Zod v4, required fields have input === undefined
      if (i?.code === "invalid_type") {
        const invalidTypeIssue = i as ZodIssueInvalidType
        if (invalidTypeIssue.input === undefined) {
          return invalidTypeIssue.expected
        }
      }
      return
    })
    .filter(Boolean)

  if (!expected.length) {
    return
  }

  const firstIssue = issues.find((i) => i != null)
  if (!firstIssue) {
    return
  }

  return `Field '${formatPath(firstIssue)}' is required`
}

const formatUnionError = (issue: ZodIssueInvalidUnion) => {
  // In Zod v4, union errors structure may differ
  const issues = (issue.errors ?? [])
    .flatMap((e: { issues?: ZodIssue[] }) => e?.issues ?? [])
    .filter((i): i is ZodIssue => i != null)

  if (!issues.length) {
    return issue.message
  }

  return (
    formatInvalidType(issues) || formatRequiredField(issues) || issue.message
  )
}

const formatError = (err: ZodError) => {
  const issueMessages = err.issues.slice(0, 3).map((issue) => {
    switch (issue.code) {
      case "invalid_type":
        return (
          formatInvalidType([issue]) ||
          formatRequiredField([issue]) ||
          issue.message
        )
      case "invalid_value": {
        // In Zod v4, invalid_literal and invalid_enum_value are now invalid_value
        const invalidValueIssue = issue as ZodIssueInvalidValue
        // Try to get the received value from various possible properties
        const receivedValue =
          "input" in issue
            ? (issue as any).input
            : "received" in issue
              ? (issue as any).received
              : undefined
        // If received is undefined, it's a required field error
        if (receivedValue === undefined) {
          return `Field '${formatPath(issue)}' is required`
        }
        // For enum values, show the expected values
        if (invalidValueIssue.values) {
          return `Expected: '${invalidValueIssue.values.join(
            ", "
          )}' for field '${formatPath(issue)}', but got: '${receivedValue}'`
        }
        return issue.message
      }
      case "invalid_union":
        return formatUnionError(issue as ZodIssueInvalidUnion)
      case "unrecognized_keys":
        return `Unrecognized fields: '${issue.keys.join(", ")}'`
      case "too_small":
        return `Value for field '${formatPath(
          issue
        )}' too small, expected at least: '${issue.minimum}'`
      case "too_big":
        return `Value for field '${formatPath(
          issue
        )}' too big, expected at most: '${issue.maximum}'`
      case "not_multiple_of":
        return `Value for field '${formatPath(issue)}' not multiple of: '${
          issue.divisor
        }'`
      case "invalid_format":
      case "invalid_key":
      case "invalid_element":
      case "custom":
      default:
        return issue.message
    }
  })

  return issueMessages.join("; ")
}

export async function zodValidator<T>(
  zodSchema: z.ZodObject<any, any> | z.ZodType<any, any, any>,
  body: T
): Promise<z.output<z.ZodObject<any, any> | z.ZodType<any, any, any>>> {
  let strictSchema = zodSchema
  // ZodEffects doesn't support setting as strict, for all other schemas we want to enforce strictness.
  if ("strict" in zodSchema) {
    strictSchema = zodSchema.strict()
  }

  try {
    return await strictSchema.parseAsync(body)
  } catch (err) {
    if (err instanceof ZodError) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid request: ${formatError(err)}`
      )
    }

    throw err
  }
}
