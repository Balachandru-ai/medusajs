import { z, ZodError } from "zod"
import { MedusaError } from "../utils"

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
    return issue.path.reduce(
      (acc: any, curr: string | number | symbol) => acc?.[curr as string],
      body
    )
  }
}

const formatPath = (issue: ZodIssue) => {
  return issue.path.join(", ")
}

const formatInvalidType = (issues: ZodIssue[]) => {
  const expected = issues
    .map((i) => {
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
  // Find the first issue that indicates a required field (input is undefined)
  const requiredIssue = issues
    .filter((i) => i != null)
    .find((i) => {
      if (i?.code === "invalid_type") {
        const invalidTypeIssue = i as ZodIssueInvalidType
        return invalidTypeIssue.input === undefined
      }
      // Also check invalid_value issues - if there's no input property or it's undefined
      if (i?.code === "invalid_value") {
        const issueAny = i as any
        const hasInput = "input" in issueAny || "received" in issueAny
        if (!hasInput) {
          return true
        }
        return issueAny.input === undefined && issueAny.received === undefined
      }
      return false
    })

  if (!requiredIssue) {
    return
  }

  return `Field '${formatPath(requiredIssue)}' is required`
}

const formatUnionError = (issue: ZodIssueInvalidUnion) => {
  const issues = (issue.errors ?? [])
    .flatMap((e: { issues?: ZodIssue[] }) => e?.issues ?? (e as ZodIssue[]))
    .filter((i): i is ZodIssue => i != null)

  if (!issues.length) {
    return issue.message
  }

  return (
    formatInvalidType(issues) || formatRequiredField(issues) || issue.message
  )
}

const formatError = (err: ZodError, body: any) => {
  const issueMessages = err.issues.slice(0, 3).map((issue) => {
    switch (issue.code) {
      case "invalid_type":
        return (
          formatInvalidType([issue]) ||
          formatRequiredField([issue]) ||
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
  if ("strict" in zodSchema) {
    strictSchema = zodSchema.strict()
  }

  try {
    return await strictSchema.parseAsync(body)
  } catch (err) {
    if (err instanceof ZodError || err.name === "ZodError") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid request: ${formatError(err, body)}`
      )
    }

    throw err
  }
}
