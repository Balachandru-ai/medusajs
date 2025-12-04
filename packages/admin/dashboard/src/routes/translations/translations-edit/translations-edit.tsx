import { useNavigate, useSearchParams } from "react-router-dom"
import { useStore, useTranslations } from "../../../hooks/api"
import { TranslationsEditForm } from "./components/translations-edit-form"
import { useEffect } from "react"
import { RouteFocusModal } from "../../../components/modals"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"

export const TranslationsEdit = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reference = searchParams.get("reference")
  const isTranslationsEnabled = useFeatureFlag("translation")

  useEffect(() => {
    if (!reference || !isTranslationsEnabled) {
      navigate(-1)
      return
    }
  }, [reference, navigate])

  // TODO: change entity_type to reference once we update that across the board
  const { translations, isPending, isError, error } = useTranslations(
    {
      entity_type: reference!,
    },
    { enabled: !!reference }
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
          // TODO: change this to get it form the entity translation config
          translatableFields={["title", "description"]}
        />
      )}
    </RouteFocusModal>
  )
}
