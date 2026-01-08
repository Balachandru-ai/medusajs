import {
  CreateTranslationSettingsDTO,
  UpdateTranslationSettingsDTO,
} from "@medusajs/framework/types"
import {
  arrayDifference,
  DmlEntity,
  MedusaError,
  MedusaErrorTypes,
  Modules,
  toSnakeCase,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const validateTranslationSettingsStepId = "validate-translation-settings"

export type ValidateTranslationSettingsStepInput = (
  | CreateTranslationSettingsDTO
  | UpdateTranslationSettingsDTO
)[]

export const validateTranslationSettingsStep = createStep(
  validateTranslationSettingsStepId,
  async (data: ValidateTranslationSettingsStepInput, { container }) => {
    const translationsModuleService = container.resolve(Modules.TRANSLATION)

    const translatableEntities = DmlEntity.getTranslatableEntities()
    const translatableEntitiesMap = new Map(
      translatableEntities.map((entity) => [toSnakeCase(entity.entity), entity])
    )

    const invalidSettings: {
      entity_type: string
      is_invalid_entity: boolean
      invalidFields?: string[]
    }[] = []

    for (const item of data) {
      let itemEntityType = item.entity_type
      if (!itemEntityType) {
        const translationSetting =
          //@ts-expect-error - if no entity_type, we are on an update
          await translationsModuleService.retrieveTranslationSettings(item.id)
        itemEntityType = translationSetting.entity_type
      }

      const entity = translatableEntitiesMap.get(itemEntityType)

      if (!entity) {
        invalidSettings.push({
          entity_type: itemEntityType,
          is_invalid_entity: true,
        })
      } else {
        const invalidFields = arrayDifference(item.fields ?? [], entity.fields)
        if (invalidFields.length) {
          invalidSettings.push({
            entity_type: itemEntityType,
            is_invalid_entity: false,
            invalidFields,
          })
        }
      }
    }

    if (invalidSettings.length) {
      throw new MedusaError(
        MedusaErrorTypes.INVALID_DATA,
        "Invalid translation settings:\n" +
          invalidSettings
            .map(
              (setting) =>
                `- ${setting.entity_type} ${
                  setting.is_invalid_entity
                    ? "is not a translatable entity"
                    : `doesn't have the following fields set as translatable: ${setting.invalidFields?.join(
                        ", "
                      )}`
                }`
            )
            .join("\n")
      )
    }

    return new StepResponse(void 0)
  }
)
