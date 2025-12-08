import { useNavigate, useSearchParams } from "react-router-dom"
import { useReferenceTranslations, useStore } from "../../../hooks/api"
import { TranslationsEditForm } from "./components/translations-edit-form"
import { useEffect } from "react"
import { RouteFocusModal } from "../../../components/modals"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"

export const TranslationsEdit = () => {
  const isTranslationsEnabled = useFeatureFlag("translation")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reference = searchParams.get("reference")
  const referenceIdParam = searchParams.getAll("reference_id")

  useEffect(() => {
    if (!reference || !isTranslationsEnabled) {
      navigate(-1)
      return
    }
  }, [reference, navigate, isTranslationsEnabled])

  const {
    translations,
    references,
    translatableFields,
    isPending,
    isError,
    error,
  } = useReferenceTranslations(reference!, referenceIdParam, {
    enabled: !!reference,
  })

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
    <RouteFocusModal prev={referenceIdParam.length ? -1 : ".."}>
      {ready && (
        <TranslationsEditForm
          translations={translations}
          references={references ?? []}
          entityType={reference!}
          availableLocales={store?.supported_locales ?? []}
          // TODO: change this to get it from the entity translation config when we have it
          translatableFields={translatableFields ?? []}
        />
      )}
    </RouteFocusModal>
  )
}
