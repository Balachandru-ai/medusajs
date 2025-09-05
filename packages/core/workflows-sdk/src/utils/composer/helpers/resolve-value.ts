import {
  deepCopy,
  OrchestrationUtils,
  parseStringifyIfNecessary,
  promiseAll,
} from "@medusajs/utils"

function resolveProperty(property, transactionContext) {
  if (property == null || typeof property !== "object") {
    return property
  }

  if (!property.__type) {
    return property
  }

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

/**
 * @internal
 */
export async function resolveValue(input, transactionContext) {
  if (input == null || typeof input !== "object") {
    return input
  }

  const unwrapInput = async (
    inputTOUnwrap: Record<string, unknown>,
    parentRef: any
  ) => {
    if (inputTOUnwrap == null) {
      return inputTOUnwrap
    }

    if (Array.isArray(inputTOUnwrap)) {
      const resolvedItems = await promiseAll(
        inputTOUnwrap.map((i) => resolveValue(i, transactionContext))
      )
      return resolvedItems
    }

    if (typeof inputTOUnwrap !== "object") {
      return inputTOUnwrap
    }

    const keys = Object.keys(inputTOUnwrap)
    const promises: { promise: Promise<any>; keyIndex: number }[] = []

    // First pass: resolve properties and collect promises with their indices
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const result = resolveProperty(inputTOUnwrap[key], transactionContext)

      if (result instanceof Promise) {
        promises.push({ promise: result, keyIndex: i })
      } else {
        // Synchronous result - assign immediately
        parentRef[key] = typeof result !== "object" ? result : deepCopy(result)

        if (typeof parentRef[key] === "object" && parentRef[key] != null) {
          parentRef[key] = await unwrapInput(parentRef[key], parentRef[key])
        }
      }
    }

    // Second pass: batch resolve only the promises and reassign to correct keys
    if (promises.length > 0) {
      const resolvedPromises = await promiseAll(promises.map((p) => p.promise))

      for (let i = 0; i < promises.length; i++) {
        const key = keys[promises[i].keyIndex]
        parentRef[key] = deepCopy(resolvedPromises[i])

        if (typeof parentRef[key] === "object" && parentRef[key] != null) {
          parentRef[key] = await unwrapInput(parentRef[key], parentRef[key])
        }
      }
    }

    return parentRef
  }

  const input_ =
    input?.__type === OrchestrationUtils.SymbolWorkflowWorkflowData
      ? input.output
      : input

  let result!: any

  if (input_?.__type) {
    result = resolveProperty(input_, transactionContext)
    if (result instanceof Promise) {
      result = await result
    }
  } else {
    result = await unwrapInput(input_, {})
  }

  return parseStringifyIfNecessary(result)
}
