import {
  Alert,
  Checkbox,
  clx,
  Heading,
  Hint,
  InlineTip,
  Label,
  Text,
} from "@medusajs/ui"
import {
  FieldArrayWithId,
  useFieldArray,
  UseFormReturn,
  useWatch,
} from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useMemo, useState } from "react"

import { Form } from "../../../../../../../components/common/form"
import { SortableList } from "../../../../../../../components/common/sortable-list"
import { SwitchBox } from "../../../../../../../components/common/switch-box"
import { Combobox } from "../../../../../../../components/inputs/combobox"
import { ProductCreateSchemaType } from "../../../../types"
import { decorateVariantsWithDefaultValues } from "../../../../utils"
import { useProductOptions } from "../../../../../../../hooks/api"
import { AdminProductOption } from "@medusajs/types"

type ProductCreateVariantsSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

const getPermutations = (
  data: { title: string; values: string[] }[]
): { [key: string]: string }[] => {
  if (data.length === 0) {
    return []
  }

  if (data.length === 1) {
    return data[0].values.map((value) => ({ [data[0].title]: value }))
  }

  const toProcess = data[0]
  const rest = data.slice(1)

  return toProcess.values.flatMap((value) => {
    return getPermutations(rest).map((permutation) => {
      return {
        [toProcess.title]: value,
        ...permutation,
      }
    })
  })
}

const getVariantName = (options: Record<string, string>) => {
  return Object.values(options).join(" / ")
}

export const ProductCreateVariantsSection = ({
  form,
}: ProductCreateVariantsSectionProps) => {
  const { t } = useTranslation()

  const variants = useFieldArray({
    control: form.control,
    name: "variants",
  })

  const watchedAreVariantsEnabled = useWatch({
    control: form.control,
    name: "enable_variants",
    defaultValue: false,
  })

  const watchedOptions = useWatch({
    control: form.control,
    name: "options",
    defaultValue: [],
  })

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  })

  const showInvalidOptionsMessage = !!form.formState.errors.options?.length
  const showInvalidVariantsMessage =
    form.formState.errors.variants?.root?.message === "invalid_length"

  const { product_options = [], isLoading } = useProductOptions({
    is_exclusive: false,
  })

  const productOptionChoices = useMemo(() => {
    return product_options.map((option) => ({
      value: option.id,
      label: option.title,
    }))
  }, [product_options])

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [selectedOptionValues, setSelectedOptionValues] = useState<
    Record<string, string[]>
  >({})
  const [customValues, setCustomValues] = useState<
    Record<string, Array<{ id: string; value: string; rank: number }>>
  >({})

  const handleProductOptionSelect = (optionIds: string[]) => {
    setSelectedOptionIds(optionIds)

    // Initialize selected values for new options (select all by default)
    const newSelectedValues: Record<string, string[]> = {}
    const selectedProductOptions = product_options.filter((option) =>
      optionIds.includes(option.id)
    )

    selectedProductOptions.forEach((option) => {
      // If option was already selected, keep its current value selection
      if (selectedOptionValues[option.id]) {
        newSelectedValues[option.id] = selectedOptionValues[option.id]
      } else {
        // New option - select all values by default
        newSelectedValues[option.id] = option.values?.map((v) => v.id) || []
      }
    })

    setSelectedOptionValues(newSelectedValues)
    updateFormWithSelectedValues(selectedProductOptions, newSelectedValues)
  }

  const handleValueChange = (optionId: string, valueIds: string[]) => {
    // Ensure at least one value is selected
    if (valueIds.length === 0) {
      return
    }

    // Detect new custom values that aren't in the options yet
    const allValues = getAllValuesForOption(optionId)
    const existingValueIds = new Set(allValues.map((v) => v.id))

    const validValueIds: string[] = []
    const newCustomValues: string[] = []
    valueIds.forEach((id) => {
      if (existingValueIds.has(id)) {
        validValueIds.push(id)
      } else {
        newCustomValues.push(id)
      }
    })

    let updatedCustomValues = customValues
    const updatedValidValueIds = [...validValueIds]
    newCustomValues.forEach((newValue) => {
      const tempId = `custom-${Date.now()}-${Math.random()}-${newValue}`

      const existingCustom = updatedCustomValues[optionId] || []
      const option = product_options.find((opt) => opt.id === optionId)
      const existingValuesCount =
        (option?.values?.length || 0) + existingCustom.length

      const newCustomValue = {
        id: tempId,
        value: newValue,
        rank: existingValuesCount + newCustomValues.indexOf(newValue),
      }

      updatedCustomValues = {
        ...updatedCustomValues,
        [optionId]: [...(updatedCustomValues[optionId] || []), newCustomValue],
      }

      updatedValidValueIds.push(tempId)
    })

    if (newCustomValues.length > 0) {
      setCustomValues(updatedCustomValues)
    }

    const updatedSelectedValues = {
      ...selectedOptionValues,
      [optionId]: updatedValidValueIds,
    }

    setSelectedOptionValues(updatedSelectedValues)

    const selectedProductOptions = product_options.filter((option) =>
      selectedOptionIds.includes(option.id)
    )
    updateFormWithSelectedValues(
      selectedProductOptions,
      updatedSelectedValues,
      newCustomValues.length > 0 ? updatedCustomValues : undefined
    )
  }

  const getAllValuesForOption = (
    optionId: string,
    customVals?: Record<
      string,
      Array<{ id: string; value: string; rank: number }>
    >
  ) => {
    const option = product_options.find((opt) => opt.id === optionId)
    const existingValues = option?.values || []
    const customForOption = (customVals || customValues)[optionId] || []

    return [...existingValues, ...customForOption]
  }

  const updateFormWithSelectedValues = (
    selectedProductOptions: AdminProductOption[],
    valueSelections: Record<string, string[]>,
    customVals?: Record<
      string,
      Array<{
        id: string
        value: string
        rank: number
      }>
    >
  ) => {
    const newOptions = selectedProductOptions.map((option) => {
      const selectedValueIds = valueSelections[option.id] || []
      const allValues = getAllValuesForOption(option.id, customVals)

      const selectedValues = allValues
        .filter((v) => selectedValueIds.includes(v.id))
        .sort((a, b) => {
          const rankA = a.rank ?? Number.MAX_VALUE
          const rankB = b.rank ?? Number.MAX_VALUE
          return rankA - rankB
        })
        .map((v) => v.value)

      return {
        id: option.id,
        title: option.title,
        values: selectedValues,
        value_ids: selectedValueIds,
      }
    })

    form.setValue("options", newOptions)

    const permutations = getPermutations(
      newOptions.filter(({ values }) => values.length)
    )

    const newVariants = permutations.map((permutation, index) => ({
      title: getVariantName(permutation),
      options: permutation,
      should_create: true,
      variant_rank: index,
      inventory: [{ inventory_item_id: "", required_quantity: "" }],
    }))

    form.setValue("variants", newVariants)
  }

  const handleRankChange = (
    items: FieldArrayWithId<ProductCreateSchemaType, "variants">[]
  ) => {
    // Items in the SortableList are memorised, so we need to find the current
    // value to preserve any changes that have been made to `should_create`.
    const update = items.map((item, index) => {
      const variant = watchedVariants.find((v) => v.title === item.title)

      return {
        id: item.id,
        ...(variant || item),
        variant_rank: index,
      }
    })

    variants.replace(update)
  }

  const getCheckboxState = (variants: ProductCreateSchemaType["variants"]) => {
    if (variants.every((variant) => variant.should_create)) {
      return true
    }

    if (variants.some((variant) => variant.should_create)) {
      return "indeterminate"
    }

    return false
  }

  const onCheckboxChange = (value: boolean | "indeterminate") => {
    switch (value) {
      case true: {
        const update = watchedVariants.map((variant) => {
          return {
            ...variant,
            should_create: true,
          }
        })

        form.setValue("variants", update)
        break
      }
      case false: {
        const update = watchedVariants.map((variant) => {
          return {
            ...variant,
            should_create: false,
          }
        })

        form.setValue("variants", decorateVariantsWithDefaultValues(update))
        break
      }
      case "indeterminate":
        break
    }
  }

  const createDefaultOptionAndVariant = () => {
    form.setValue("options", [
      {
        title: "Default option",
        values: ["Default option value"],
      },
    ])
    form.setValue(
      "variants",
      decorateVariantsWithDefaultValues([
        {
          title: "Default variant",
          should_create: true,
          variant_rank: 0,
          options: {
            "Default option": "Default option value",
          },
          inventory: [{ inventory_item_id: "", required_quantity: "" }],
          is_default: true,
        },
      ])
    )
  }

  return (
    <div id="variants" className="flex flex-col gap-y-8">
      <div className="flex flex-col gap-y-6">
        <Heading level="h2">{t("products.create.variants.header")}</Heading>
        <SwitchBox
          control={form.control}
          name="enable_variants"
          label={t("products.create.variants.subHeadingTitle")}
          description={t("products.create.variants.subHeadingDescription")}
          onCheckedChange={(checked) => {
            if (checked) {
              form.setValue("options", [
                {
                  title: "",
                  values: [],
                },
              ])
              form.setValue("variants", [])
            } else {
              createDefaultOptionAndVariant()
            }
            setSelectedOptionIds([])
            setSelectedOptionValues({})
            setCustomValues({})
          }}
        />
      </div>
      {watchedAreVariantsEnabled && (
        <>
          <div className="flex flex-col gap-y-6">
            <div className="flex flex-col">
              <Label weight="plus">
                {t("products.create.variants.productOptions.label")}
              </Label>
              <Hint>{t("products.create.variants.productOptions.hint")}</Hint>
            </div>
            {showInvalidOptionsMessage && (
              <Alert dismissible variant="error">
                {t("products.create.errors.options")}
              </Alert>
            )}
            <Combobox
              value={selectedOptionIds}
              onChange={(value) => handleProductOptionSelect(value as string[])}
              options={productOptionChoices}
              placeholder={t("products.fields.options.optionTitlePlaceholder")}
              disabled={isLoading}
              displayMode="chips"
            />
          </div>
          {selectedOptionIds.length > 0 && (
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col">
                <Label weight="plus">{t("fields.values")}</Label>
                <Hint>{t("products.create.variants.selectValuesHint")}</Hint>
              </div>
              <div className="flex flex-col gap-y-3">
                {product_options
                  .filter((option) => selectedOptionIds.includes(option.id))
                  .map((option) => {
                    // Get all values (existing + custom) for this option
                    const allValues = getAllValuesForOption(option.id)

                    const valueOptions = allValues
                      .sort((a, b) => {
                        const rankA = a.rank ?? Number.MAX_VALUE
                        const rankB = b.rank ?? Number.MAX_VALUE
                        return rankA - rankB
                      })
                      .map((v) => ({
                        value: v.id,
                        label: v.value,
                      }))

                    return (
                      <div key={option.id} className="flex flex-col gap-y-2">
                        <Label size="small" weight="plus">
                          {option.title}
                        </Label>
                        <Combobox
                          value={selectedOptionValues[option.id] || []}
                          onChange={(value) =>
                            handleValueChange(option.id, value as string[])
                          }
                          onCreateOption={(_) => {
                            // Todo
                          }}
                          options={valueOptions}
                          placeholder={t(
                            "products.fields.options.variantionsPlaceholder"
                          )}
                          displayMode="chips"
                        />
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-4 gap-y-8">
            <div className="flex flex-col gap-y-6">
              <div className="flex flex-col">
                <Label weight="plus">
                  {t("products.create.variants.productVariants.label")}
                </Label>
                <Hint>
                  {t("products.create.variants.productVariants.hint")}
                </Hint>
              </div>
              {!showInvalidOptionsMessage && showInvalidVariantsMessage && (
                <Alert dismissible variant="error">
                  {t("products.create.errors.variants")}
                </Alert>
              )}
              {variants.fields.length > 0 ? (
                <div className="overflow-hidden rounded-xl border">
                  <div
                    className="bg-ui-bg-component text-ui-fg-subtle grid items-center gap-3 border-b px-6 py-2.5"
                    style={{
                      gridTemplateColumns: `20px 28px repeat(${watchedOptions.length}, 1fr)`,
                    }}
                  >
                    <div>
                      <Checkbox
                        className="relative"
                        checked={getCheckboxState(watchedVariants)}
                        onCheckedChange={onCheckboxChange}
                      />
                    </div>
                    <div />
                    {watchedOptions.map((option, index) => (
                      <div key={index}>
                        <Text size="small" leading="compact" weight="plus">
                          {option.title}
                        </Text>
                      </div>
                    ))}
                  </div>
                  <SortableList
                    items={variants.fields}
                    onChange={handleRankChange}
                    renderItem={(item, index) => {
                      return (
                        <SortableList.Item
                          id={item.id}
                          className={clx("bg-ui-bg-base border-b", {
                            "border-b-0": index === variants.fields.length - 1,
                          })}
                        >
                          <div
                            className="text-ui-fg-subtle grid w-full items-center gap-3 px-6 py-2.5"
                            style={{
                              gridTemplateColumns: `20px 28px repeat(${watchedOptions.length}, 1fr)`,
                            }}
                          >
                            <Form.Field
                              control={form.control}
                              name={`variants.${index}.should_create` as const}
                              render={({
                                field: { value, onChange, ...field },
                              }) => {
                                return (
                                  <Form.Item>
                                    <Form.Control>
                                      <Checkbox
                                        className="relative"
                                        {...field}
                                        checked={value}
                                        onCheckedChange={onChange}
                                      />
                                    </Form.Control>
                                  </Form.Item>
                                )
                              }}
                            />
                            <SortableList.DragHandle />
                            {Object.values(item.options).map((value, index) => (
                              <Text key={index} size="small" leading="compact">
                                {value}
                              </Text>
                            ))}
                          </div>
                        </SortableList.Item>
                      )
                    }}
                  />
                </div>
              ) : (
                <Alert>
                  {t("products.create.variants.productVariants.alert")}
                </Alert>
              )}
              {variants.fields.length > 0 && (
                <InlineTip label={t("general.tip")}>
                  {t("products.create.variants.productVariants.tip")}
                </InlineTip>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
