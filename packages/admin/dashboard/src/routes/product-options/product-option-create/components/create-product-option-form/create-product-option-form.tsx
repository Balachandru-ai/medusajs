import { zodResolver } from "@hookform/resolvers/zod"
import { Button, ProgressStatus, ProgressTabs, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useState } from "react"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateProductOption } from "../../../../../hooks/api/product-options"
import { CreateProductOptionDetails } from "./create-product-option-details"
import { CreateProductOptionOrganize } from "./create-product-option-organize"
import {
  CreateProductOptionDetailsSchema,
  CreateProductOptionSchema,
} from "./schema"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"

enum Tab {
  DETAILS = "details",
  ORGANIZE = "organize",
}

export const CreateProductOptionForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DETAILS)
  const [validDetails, setValidDetails] = useState(false)

  const form = useForm<CreateProductOptionSchema>({
    defaultValues: {
      title: "",
      values: [],
      value_ranks: {},
    },
    resolver: zodResolver(CreateProductOptionSchema),
  })

  const handleTabChange = (tab: Tab) => {
    if (tab === Tab.ORGANIZE) {
      const { title, values } = form.getValues()

      const result = CreateProductOptionDetailsSchema.safeParse({
        title,
        values,
      })

      if (!result.success) {
        result.error.errors.forEach((error) => {
          form.setError(
            error.path.join(".") as keyof CreateProductOptionSchema,
            {
              type: "manual",
              message: error.message,
            }
          )
        })

        return
      }

      form.clearErrors()
      setValidDetails(true)
    }

    setActiveTab(tab)
  }

  const { mutateAsync, isPending } = useCreateProductOption()

  const handleSubmit = form.handleSubmit((data) => {
    const { title, values, value_ranks } = data

    // Sort values by rank if ranks are defined
    let orderedValues = values
    if (value_ranks && Object.keys(value_ranks).length > 0) {
      orderedValues = [...values].sort((a, b) => {
        const rankA = value_ranks[a] ?? values.indexOf(a)
        const rankB = value_ranks[b] ?? values.indexOf(b)
        return rankA - rankB
      })
    }

    mutateAsync(
      {
        title,
        values: orderedValues,
      },
      {
        onSuccess: ({ product_option }) => {
          toast.success(
            t("productOptions.create.successToast", {
              title: product_option.title,
            })
          )

          handleSuccess(`/product-options/${product_option.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const organizeStatus: ProgressStatus =
    form.getFieldState("value_ranks")?.isDirty || activeTab === Tab.ORGANIZE
      ? "in-progress"
      : "not-started"

  const detailsStatus: ProgressStatus = validDetails
    ? "completed"
    : "in-progress"

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <ProgressTabs
          dir={direction}
          value={activeTab}
          onValueChange={(tab) => handleTabChange(tab as Tab)}
          className="flex size-full flex-col"
        >
          <RouteFocusModal.Header>
            <div className="flex w-full items-center justify-between">
              <div className="-my-2 w-full max-w-[400px] border-l">
                <ProgressTabs.List className="grid w-full grid-cols-2">
                  <ProgressTabs.Trigger
                    value={Tab.DETAILS}
                    status={detailsStatus}
                    className="w-full min-w-0 overflow-hidden"
                  >
                    <span className="truncate">
                      {t("productOptions.create.tabs.details")}
                    </span>
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    value={Tab.ORGANIZE}
                    status={organizeStatus}
                    className="w-full min-w-0 overflow-hidden"
                  >
                    <span className="truncate">
                      {t("productOptions.create.tabs.organize")}
                    </span>
                  </ProgressTabs.Trigger>
                </ProgressTabs.List>
              </div>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body className="flex size-full flex-col overflow-auto">
            <ProgressTabs.Content value={Tab.DETAILS}>
              <CreateProductOptionDetails form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              value={Tab.ORGANIZE}
              className="bg-ui-bg-subtle flex-1"
            >
              <CreateProductOptionOrganize form={form} />
            </ProgressTabs.Content>
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
              {activeTab === Tab.ORGANIZE ? (
                <Button
                  key="submit-btn"
                  size="small"
                  variant="primary"
                  type="submit"
                  isLoading={isPending}
                >
                  {t("actions.save")}
                </Button>
              ) : (
                <Button
                  key="continue-btn"
                  size="small"
                  variant="primary"
                  type="button"
                  onClick={() => handleTabChange(Tab.ORGANIZE)}
                >
                  {t("actions.continue")}
                </Button>
              )}
            </div>
          </RouteFocusModal.Footer>
        </ProgressTabs>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
