import { HttpTypes } from "@medusajs/types"
import { Button, Hint, Label, toast } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useExtendableForm } from "../../../../../dashboard-app"
import {
  useLinkProductOptions,
  useProductOptions,
} from "../../../../../hooks/api"
import { useExtension } from "../../../../../providers/extension-provider"

type ProductOptionsManageFormProps = {
  product: HttpTypes.AdminProduct
}

const ProductOptionsManageSchema = zod.object({
  option_ids: zod.array(zod.string()),
  option_values: zod.record(zod.array(zod.string())).optional(),
})

export const ProductOptionsManageForm = ({
  product,
}: ProductOptionsManageFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { getFormConfigs } = useExtension()
  const configs = getFormConfigs("product", "edit")

  const { product_options = [], isLoading } = useProductOptions({
    is_exclusive: false,
  })

  const productOptionChoices = useMemo(() => {
    return product_options.map((option) => ({
      value: option.id,
      label: option.title,
    }))
  }, [product_options])

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    product.options?.map((opt) => opt.id) || []
  )

  const [selectedOptionValues, setSelectedOptionValues] = useState<
    Record<string, string[]>
  >(() => {
    // Initialize with existing product option values
    const initialValues: Record<string, string[]> = {}
    product.options?.forEach((opt) => {
      initialValues[opt.id] = opt.values?.map((v) => v.id) || []
    })
    return initialValues
  })

  const form = useExtendableForm({
    defaultValues: {
      option_ids: product.options?.map((opt) => opt.id) || [],
      option_values: (() => {
        const initialValues: Record<string, string[]> = {}
        product.options?.forEach((opt) => {
          initialValues[opt.id] = opt.values?.map((v) => v.id) || []
        })
        return initialValues
      })(),
    },
    schema: ProductOptionsManageSchema,
    configs: configs,
    data: product,
  })

  const { mutateAsync, isPending } = useLinkProductOptions(product.id)

  const handleProductOptionSelect = (optionIds: string[]) => {
    setSelectedOptionIds(optionIds)
    form.setValue("option_ids", optionIds)

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
    form.setValue("option_values", newSelectedValues)
  }

  const handleValueChange = (optionId: string, valueIds: string[]) => {
    // Ensure at least one value is selected
    if (valueIds.length === 0) {
      return
    }

    const updatedSelectedValues = {
      ...selectedOptionValues,
      [optionId]: valueIds,
    }

    setSelectedOptionValues(updatedSelectedValues)
    form.setValue("option_values", updatedSelectedValues)
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    const currentOptionIds = product.options?.map((opt) => opt.id) || []
    const newOptionIds = data.option_ids

    const optionsToAdd: (string | { id: string; value_ids: string[] })[] = []
    const optionsToRemove: string[] = []

    // Check for completely removed options
    for (const currentId of currentOptionIds) {
      if (!newOptionIds.includes(currentId)) {
        optionsToRemove.push(currentId)
      }
    }

    // Check for new options or options with changed values
    for (const newId of newOptionIds) {
      const isNewOption = !currentOptionIds.includes(newId)

      if (isNewOption) {
        optionsToAdd.push(
          data.option_values
            ? {
                id: newId,
                value_ids: data.option_values[newId],
              }
            : newId
        )
      } else {
        const currentOption = product.options?.find((opt) => opt.id === newId)
        const currentValueIds =
          currentOption?.values?.map((v) => v.id).sort() || []
        const newValueIds = [...(data.option_values?.[newId] || [])].sort()

        const valuesChanged =
          currentValueIds.length !== newValueIds.length ||
          currentValueIds.some((id, index) => id !== newValueIds[index])

        if (valuesChanged) {
          optionsToRemove.push(newId)
          optionsToAdd.push(
            data.option_values
              ? {
                  id: newId,
                  value_ids: data.option_values[newId],
                }
              : newId
          )
        }
      }
    }

    await mutateAsync(
      {
        add: optionsToAdd,
        remove: optionsToRemove,
      },
      {
        onSuccess: ({ product }) => {
          toast.success(
            t("products.organization.edit.toasts.success", {
              title: product.title,
            })
          )
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex h-full flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="option_ids"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t("products.options.manage.label")}
                    </Form.Label>
                    <Form.Hint>{t("products.options.manage.hint")}</Form.Hint>
                    <Form.Control>
                      <Combobox
                        {...field}
                        value={selectedOptionIds}
                        onChange={(value) =>
                          handleProductOptionSelect(value as string[])
                        }
                        options={productOptionChoices}
                        placeholder={t("products.options.manage.placeholder")}
                        disabled={isLoading}
                        displayMode="chips"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
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
                      const valueOptions =
                        option.values
                          ?.sort((a, b) => {
                            const rankA = a.rank ?? Number.MAX_VALUE
                            const rankB = b.rank ?? Number.MAX_VALUE
                            return rankA - rankB
                          })
                          .map((v) => ({
                            value: v.id,
                            label: v.value,
                          })) || []

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
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
