import { useNavigate, useSearchParams } from "react-router-dom"
import { useStore, useTranslations } from "../../../hooks/api"
import { TranslationsEditForm } from "./components/translations-edit-form"
import { useEffect } from "react"
import { RouteFocusModal } from "../../../components/modals"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"

export const TranslationsEdit = () => {
  const isTranslationsEnabled = useFeatureFlag("translation")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reference = searchParams.get("reference")
  const referenceId = searchParams.getAll("reference_id")

  useEffect(() => {
    if ((!reference && !referenceId) || !isTranslationsEnabled) {
      navigate(-1)
      return
    }
  }, [reference, referenceId, navigate, isTranslationsEnabled])

  const { translations, isPending, isError, error } = useTranslations(
    {
      reference: reference ?? undefined,
      reference_id: referenceId,
    },
    { enabled: !!reference || !!referenceId }
  )

  const {
    store,
    isPending: isStorePending,
    isError: isStoreError,
    error: storeError,
  } = useStore()

  const ready = !isPending && !!translations && !isStorePending && !!store

  if (isError || isStoreError) {
    throw error || storeError
  }

  return (
    <RouteFocusModal>
      {ready && (
        <TranslationsEditForm
          translations={translations}
          entityType={reference!}
          availableLocales={store?.supported_locales ?? []}
          // TODO: change this to get it from the entity translation config when we have it
          translatableFields={["title", "description"]}
        />
      )}
    </RouteFocusModal>
  )
}
