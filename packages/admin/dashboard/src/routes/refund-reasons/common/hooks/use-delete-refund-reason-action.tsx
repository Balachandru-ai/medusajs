import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useDeleteRefundReason } from "../../../../hooks/api"

export const useDeleteRefundReasonAction = (id: string, label: string) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const { mutateAsync } = useDeleteRefundReason(id)

  return async () => {
    const result = await prompt({
      title: t("general.areYouSure"),
      description: t("refundReasons.delete.confirmation", {
        label,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!result) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("refundReasons.delete.successToast"))
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }
}
