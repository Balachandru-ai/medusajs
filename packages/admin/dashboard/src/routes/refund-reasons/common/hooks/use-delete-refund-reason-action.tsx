import { toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useDeleteRefundReason } from "../../../../hooks/api"

export const useDeleteRefundReasonAction = (id: string) => {
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteRefundReason(id)

  return async () => {
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
