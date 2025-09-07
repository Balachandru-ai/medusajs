import {
  deepCopy,
  isObject,
  OrchestrationUtils,
  parseStringifyIfNecessary,
  promiseAll,
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
}) {
  if (inputTOUnwrap == null) {
    return inputTOUnwrap
  }

  if (Array.isArray(inputTOUnwrap)) {
    const promises: { promise: Promise<any>; index: number }[] = []
    const resolvedItems: any[] = new Array(inputTOUnwrap.length)
    for (let i = 0; i < inputTOUnwrap.length; i++) {
      const item = inputTOUnwrap[i]
      if (item == null || typeof item !== "object") {
        resolvedItems[i] = item
      } else {
        promises.push({
          promise: resolveValue(item, transactionContext),
          index: i,
        })
      }
    }

    const resolvedPromises = await promiseAll(promises.map((p) => p.promise))
    for (let i = 0; i < promises.length; i++) {
      resolvedItems[promises[i].index] = resolvedPromises[i]
    }

    return resolvedItems
  }

  if (util.types.isProxy(inputTOUnwrap)) {
    inputTOUnwrap = resolveProperty(inputTOUnwrap, transactionContext)
  }

  if (!isObject(inputTOUnwrap)) {
    return inputTOUnwrap
  }

  const keys = Object.keys(inputTOUnwrap)
  const promises: { promise: Promise<any>; keyIndex: number }[] = []

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    if (inputTOUnwrap[key] == null || typeof inputTOUnwrap[key] !== "object") {
      parentRef[key] = inputTOUnwrap[key]
      continue
    }

    const result = resolveProperty(inputTOUnwrap[key], transactionContext)

    if (result instanceof Promise) {
      promises.push({ promise: result, keyIndex: i })
    } else {
      parentRef[key] = result

      if (isObject(parentRef[key])) {
        parentRef[key] = await unwrapInput({
          inputTOUnwrap: parentRef[key],
          parentRef: parentRef[key],
          transactionContext,
        })
      }
    }
  }

  if (promises.length > 0) {
    const resolvedPromises = await promiseAll(promises.map((p) => p.promise))

    for (let i = 0; i < promises.length; i++) {
      const key = keys[promises[i].keyIndex]
      parentRef[key] = resolvedPromises[i]

      if (isObject(parentRef[key])) {
        parentRef[key] = await unwrapInput({
          inputTOUnwrap: parentRef[key],
          parentRef: parentRef[key],
          transactionContext,
        })
      }
    }
  }

  return parentRef
}

/**
 * @internal
 */
export async function resolveValue(
  input: InputPrimitive | InputObject | unknown | undefined,
  transactionContext
) {
  if (input == null || typeof input !== "object") {
    return input
  }

  const input_ = deepCopy(
    (input as InputObject)?.__type ===
      OrchestrationUtils.SymbolWorkflowWorkflowData
      ? (input as InputObject).output
      : input
  )

  let result!: any

  if (input_?.__type) {
    result = resolveProperty(input_, transactionContext)
    if (result instanceof Promise) {
      result = await result
    }
  } else {
    result = await unwrapInput({
      inputTOUnwrap: input_,
      parentRef: {},
      transactionContext,
    })
  }

  return parseStringifyIfNecessary(result)
}
