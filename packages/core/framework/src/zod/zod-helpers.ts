import { z, ZodError } from "zod"
import { MedusaError } from "../utils"

/**
 * Zod v4 does not export public issue types, so we use internal types from z.core.
 * These are prefixed with $ to indicate they are internal.
 * While internal, they are stable for type-checking purposes.
 * Runtime behavior relies on the `code` property, not these types.
 */
type ZodIssue = z.core.$ZodIssue
type ZodIssueInvalidType = z.core.$ZodIssueInvalidType
type ZodIssueInvalidUnion = z.core.$ZodIssueInvalidUnion
type ZodIssueInvalidValue = z.core.$ZodIssueInvalidValue

function getReceivedValue(issue: ZodIssueInvalidValue, body: any) {
  if ("input" in issue) {
    return issue.input
  } else if ("received" in issue) {
    return issue.received
  } else {
    return issue.path.reduce<any>((acc, curr: PropertyKey) => acc?.[curr], body)
  }
}

const formatPath = (issue: ZodIssue) => {
  return issue.path.join(", ")
}

/**
 * Gets the actual value from body using issue path.
 * Used to distinguish between missing fields and wrong type values.
 */
function getValueFromBody(issue: ZodIssue, body: any): any {
  return issue.path.reduce<any>((acc, curr: PropertyKey) => acc?.[curr], body)
}

const formatInvalidType = (issues: ZodIssue[], body?: any) => {
  const expected = issues
    .map((i) => {
      if (i?.code === "invalid_type") {
        const invalidTypeIssue = i as ZodIssueInvalidType
        // In Zod v4, check if value exists in body to distinguish wrong type vs missing
        const receivedValue = body !== undefined ? getValueFromBody(i, body) : undefined
        if (receivedValue !== undefined) {
          return invalidTypeIssue.expected
        }
      }
      return
    })
    .filter(Boolean)

  if (!expected.length) {
    return
  }

  const firstIssue = issues[0] as ZodIssueInvalidType
  const received = body !== undefined ? getValueFromBody(firstIssue, body) : "unknown"

  return `Expected type: '${expected.join(", ")}' for field '${formatPath(
    firstIssue
  )}', got: '${received}'`
}

const formatRequiredField = (issues: ZodIssue[], body?: any) => {
  // Find the first issue that indicates a required field (value is undefined in body)
  const requiredIssue = issues
    .filter((i) => i != null)
    .find((i) => {
      if (i?.code === "invalid_type") {
        // In Zod v4, check if value is undefined in body to detect missing fields
        const valueInBody = body !== undefined ? getValueFromBody(i, body) : undefined
        return valueInBody === undefined
      }
      // Also check invalid_value issues - if value is undefined in body
      if (i?.code === "invalid_value") {
        const valueInBody = body !== undefined ? getValueFromBody(i, body) : undefined
        return valueInBody === undefined
      }
      return false
    })

  if (!requiredIssue) {
    return
  }

  return `Field '${formatPath(requiredIssue)}' is required`
}

const formatUnionError = (issue: ZodIssueInvalidUnion, body?: any) => {
  const parentPath = issue.path ?? []
  const issues = (issue.errors ?? [])
    .flatMap((e: { issues?: ZodIssue[] }) => e?.issues ?? (e as ZodIssue[]))
    .filter((i): i is ZodIssue => i != null)
    .map((i) => ({
      ...i,
      path: [...parentPath, ...i.path],
    }))

  if (!issues.length) {
    return issue.message
  }

  return (
    formatInvalidType(issues, body) || formatRequiredField(issues, body) || issue.message
  )
}

const formatError = (err: ZodError, body: any) => {
  const issueMessages = err.issues.slice(0, 3).map((issue) => {
    switch (issue.code) {
      case "invalid_type":
        return (
          formatInvalidType([issue], body) ||
          formatRequiredField([issue], body) ||
          issue.message
        )
      case "invalid_value": {
        const invalidValueIssue = issue as ZodIssueInvalidValue
        const receivedValue = getReceivedValue(issue, body)

        const hasReceivedValue = receivedValue !== undefined

        if (invalidValueIssue.values) {
          if (!hasReceivedValue) {
            return `Field '${formatPath(issue)}' is required`
          }

          return `Expected: '${invalidValueIssue.values.join(
            ", "
          )}' for field '${formatPath(issue)}', but got: '${receivedValue}'`
        }

        if (!hasReceivedValue) {
          return `Field '${formatPath(issue)}' is required`
        }
        return issue.message
      }
      case "invalid_union":
        return formatUnionError(issue as ZodIssueInvalidUnion, body)
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

function isZodError(err: unknown): err is ZodError {
  return (
    err instanceof ZodError ||
    (err !== null &&
      typeof err === "object" &&
      "issues" in err &&
      Array.isArray((err as { issues: unknown }).issues))
  )
}

export async function zodValidator<T>(
  zodSchema: z.ZodObject<any, any> | z.ZodType<any, any, any>,
  body: T
): Promise<z.output<z.ZodObject<any, any> | z.ZodType<any, any, any>>> {
  let strictSchema = zodSchema
  if ("strict" in zodSchema) {
    strictSchema = zodSchema.strict()
  }

  try {
    return await strictSchema.parseAsync(body)
  } catch (err) {
    if (isZodError(err)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid request: ${formatError(err, body)}`
      )
    }

    throw err
  }
}
