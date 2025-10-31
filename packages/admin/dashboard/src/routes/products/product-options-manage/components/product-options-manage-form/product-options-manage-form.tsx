import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
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

  const form = useExtendableForm({
    defaultValues: {
      option_ids: product.options?.map((opt) => opt.id) || [],
    },
    schema: ProductOptionsManageSchema,
    configs: configs,
    data: product,
  })

  const { mutateAsync, isPending } = useLinkProductOptions(product.id)

  const handleProductOptionSelect = (optionIds: string[]) => {
    setSelectedOptionIds(optionIds)
    form.setValue("option_ids", optionIds)
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    const currentOptionIds = product.options?.map((opt) => opt.id) || []
    const newOptionIds = data.option_ids

    // Determine which options to add and remove
    const optionsToAdd = newOptionIds.filter(
      (id) => !currentOptionIds.includes(id)
    )
    const optionsToRemove = currentOptionIds.filter(
      (id) => !newOptionIds.includes(id)
    )

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
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
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
