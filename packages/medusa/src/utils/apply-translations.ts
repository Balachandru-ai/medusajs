import { MedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  isObject,
  upperCaseFirst,
} from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/types"
import TranslationFeatureFlag from "../feature-flags/translation"

const excludedKeys = [
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "metadata",
]

function canApplyTranslationTo(object: Record<string, any>) {
  return "id" in object && !!object.id
}

function gatherIds(object: Record<string, any>, gatheredIds: Set<string>) {
  gatheredIds.add(object.id)
  Object.entries(object).forEach(([, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => gatherIds(item, gatheredIds))
    } else if (isObject(value)) {
      gatherIds(value, gatheredIds)
    }
  })
}

function applyTranslation(
  object: Record<string, any>,
  entityIdToTranslation: Map<string, Record<string, any>>
) {
  const translation = entityIdToTranslation.get(object.id)
  const hasTranslation = !!translation

  Object.entries(object).forEach(([key, value]) => {
    if (excludedKeys.includes(key)) {
      return
    }

    if (hasTranslation) {
      if (
        key in translation &&
        typeof object[key] === typeof translation[key]
      ) {
        object[key] = translation[key]
        return
      }
    }

    if (Array.isArray(value)) {
      value.forEach(
        (item) =>
          canApplyTranslationTo(item) &&
          applyTranslation(item, entityIdToTranslation)
      )
    } else if (isObject(value) && canApplyTranslationTo(value)) {
      applyTranslation(value, entityIdToTranslation)
    }
  })
}

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

  const locale = req.locale

  if (!locale) {
    return
  }

  const gatheredIds: Set<string> = new Set()

  for (const inputObject of inputObjects) {
    gatherIds(inputObject, gatheredIds)
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const queryBatchSize = 250
  const queryBatches = Math.ceil(gatheredIds.size / queryBatchSize)

  const entityIdToTranslation = new Map<string, Record<string, any>>()

  for (let i = 0; i < queryBatches; i++) {
    // TODO: concurrently fetch if needed
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

  for (const inputObject of inputObjects) {
    applyTranslation(inputObject, entityIdToTranslation)
  }
}

function normalizeLocale(locale: string) {
  const segments = locale.split("-")

  // e.g en
  if (segments.length === 1) {
    return segments[0].toLowerCase()
  }

  // e.g en-US
  if (segments.length === 2) {
    return `${segments[0].toLowerCase()}-${segments[1].toUpperCase()}`
  }

  // e.g ru-Cyrl-BY
  if (segments.length === 3) {
    return `${segments[0].toLowerCase()}-${upperCaseFirst(
      segments[1]
    )}-${segments[2].toUpperCase()}`
  }

  return locale
}
