import { MedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  isObject,
} from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/types"
import TranslationFeatureFlag from "../feature-flags/translation"

export async function applyTranslations({
  req,
  inputObjects,
  container,
}: {
  req: MedusaRequest
  inputObjects: Record<string, any>[]
  container: MedusaContainer
}) {
  const isTranslationEnabled = FeatureFlag.isFeatureEnabled(
    TranslationFeatureFlag.key
  )

  if (!isTranslationEnabled) {
    return
  }

  const locale = req.locale ?? "en-US"

  const gatheredIds: Set<string> = new Set()
  function gatherIds(object: Record<string, any>) {
    gatheredIds.add(object.id)
    Object.entries(object).forEach(([, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => gatherIds(item))
      } else if (isObject(value)) {
        gatherIds(value)
      }
    })
  }

  for (const inputObject of inputObjects) {
    gatherIds(inputObject)
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const queryBatchSize = 250
  const queryBatches = Math.ceil(gatheredIds.size / queryBatchSize)

  const entityIdToTranslation = new Map<string, Record<string, any>>()

  for (let i = 0; i < queryBatches; i++) {
    const queryBatch = Array.from(gatheredIds).slice(
      i * queryBatchSize,
      (i + 1) * queryBatchSize
    )

    const { data: translations } = await query.graph({
      entity: "translations",
      fields: ["translations", "entity_id"],
      filters: {
        entity_id: queryBatch,
        locale_code: locale,
      },
      pagination: {
        take: queryBatchSize,
      },
    })

    for (const translation of translations) {
      entityIdToTranslation.set(
        translation.entity_id,
        translation.translations ?? {}
      )
    }
  }

  function applyTranslation(object: Record<string, any>) {
    const translation = entityIdToTranslation.get(object.id)
    if (translation) {
      Object.keys(translation).forEach((key) => {
        object[key] = translation[key]
      })
    }

    Object.entries(object).forEach(([, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => applyTranslation(item))
      } else if (isObject(value)) {
        applyTranslation(value)
      }
    })
  }

  for (const inputObject of inputObjects) {
    applyTranslation(inputObject)
  }
}
