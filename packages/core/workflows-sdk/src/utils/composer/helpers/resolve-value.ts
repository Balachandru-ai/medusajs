import {
  deepCopy,
  isObject,
  OrchestrationUtils,
  parseStringifyIfNecessary,
} from "@medusajs/utils"
import * as util from "node:util"

type InputPrimitive = string | Symbol
type InputObject = object & { __type?: string | Symbol; output?: any }

function resolveProperty(property, transactionContext) {
  const { invoke: invokeRes } = transactionContext

  let res

  if (property.__type === OrchestrationUtils.SymbolInputReference) {
    res = transactionContext.payload
  } else if (
    property.__type === OrchestrationUtils.SymbolMedusaWorkflowResponse
  ) {
    res = resolveValue(property.$result, transactionContext)
  } else if (
    property.__type === OrchestrationUtils.SymbolWorkflowStepTransformer
  ) {
    res = property.__resolver(transactionContext)
  } else if (property.__type === OrchestrationUtils.SymbolWorkflowStep) {
    const output =
      invokeRes[property.__step__]?.output ?? invokeRes[property.__step__]
    if (output?.__type === OrchestrationUtils.SymbolWorkflowStepResponse) {
      res = output.output
    } else {
      res = output
    }
  } else if (
    property.__type === OrchestrationUtils.SymbolWorkflowStepResponse
  ) {
    res = property.output
  } else {
    res = property
  }

  return res
}

async function unwrapInput({
  inputTOUnwrap,
  parentRef,
  transactionContext,
}: {
  inputTOUnwrap: InputObject
  parentRef: any
  transactionContext: any
}): Promise<any> {
  if (inputTOUnwrap == null) {
    return inputTOUnwrap
  }

  if (Array.isArray(inputTOUnwrap)) {
    const resolvedItems: any[] = new Array(inputTOUnwrap.length)

    for (let i = 0; i < inputTOUnwrap.length; i++) {
      const item = inputTOUnwrap[i]
      if (item == null || typeof item !== "object") {
        resolvedItems[i] = item
      } else {
        const resolved = await resolveValue(item, transactionContext)
        resolvedItems[i] = resolved
      }
    }

    return resolvedItems
  }

  if (util.types.isProxy(inputTOUnwrap)) {
    const resolved = await resolveProperty(inputTOUnwrap, transactionContext)
    if (!isObject(resolved)) {
      return inputTOUnwrap
    }
    return unwrapInput({
      inputTOUnwrap: resolved,
      parentRef: {},
      transactionContext,
    })
  }

  if (!isObject(inputTOUnwrap)) {
    return inputTOUnwrap
  }

  const keys = Object.keys(inputTOUnwrap)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    if (inputTOUnwrap[key] == null || typeof inputTOUnwrap[key] !== "object") {
      parentRef[key] = inputTOUnwrap[key]
      continue
    }

    const result = await resolveProperty(inputTOUnwrap[key], transactionContext)
    parentRef[key] = result

    if (result != null && typeof result === "object") {
      const unwrapped = await unwrapInput({
        inputTOUnwrap: result,
        parentRef: parentRef[key] || {},
        transactionContext,
      })

      parentRef[key] = unwrapped
    }
  }

  return parentRef
}

export async function resolveValue(
  input: InputPrimitive | InputObject | unknown | undefined,
  transactionContext
): Promise<any> {
  if (input == null || typeof input !== "object") {
    return input
  }

  const input_ = deepCopy(
    (input as InputObject)?.__type ===
      OrchestrationUtils.SymbolWorkflowWorkflowData
      ? (input as InputObject).output
      : input
  )

  let result: any

  if (input_?.__type) {
    result = await resolveProperty(input_, transactionContext)
    return await parseStringifyIfNecessary(result)
  } else {
    result = await unwrapInput({
      inputTOUnwrap: input_,
      parentRef: {},
      transactionContext,
    })
    return await parseStringifyIfNecessary(result)
  }
}
