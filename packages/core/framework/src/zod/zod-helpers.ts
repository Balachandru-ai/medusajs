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
        const issueAny = issue as any
        let receivedValue: unknown
        let foundProperty = false

        if ("input" in issueAny) {
          receivedValue = issueAny.input
          foundProperty = true
        } else if ("received" in issueAny) {
          receivedValue = issueAny.received
          foundProperty = true
        } else if ("path" in issueAny) {
          receivedValue = issueAny.path.reduce(
            (acc: any, curr: string) => acc[curr],
            body
          )
          foundProperty = true
        }

        const hasReceivedValue = foundProperty && receivedValue !== undefined

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
