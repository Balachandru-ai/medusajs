import { zodResolver } from "@hookform/resolvers/zod"
import { AdminStoreLocale, HttpTypes } from "@medusajs/types"
import { Button, Prompt, Select, toast } from "@medusajs/ui"
import { ColumnDef } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import {
  createDataGridHelper,
  DataGrid,
} from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useBatchTranslations } from "../../../../../hooks/api/translations"

/**
 * Schema for a single locale translation.
 */
const LocaleTranslationSchema = z.object({
  id: z.string().nullish(),
  locale_code: z.string(),
  fields: z.record(z.string().optional()),
})
export type LocaleTranslationSchema = z.infer<typeof LocaleTranslationSchema>

/**
 * Schema for an entity's translations (parent row in DataGrid).
 * Contains all locale translations for that entity.
 */
const EntityTranslationsSchema = z.object({
  locales: z.record(LocaleTranslationSchema),
})
export type EntityTranslationsSchema = z.infer<typeof EntityTranslationsSchema>

/**
 * Form schema
 * Maps each reference_id to their corresponding translations for each locale
 */
export const TranslationsFormSchema = z.object({
  entities: z.record(EntityTranslationsSchema),
})
export type TranslationsFormSchema = z.infer<typeof TranslationsFormSchema>

/**
 * Row types for the DataGrid.
 * Parent rows are entities, subrows are translatable fields.
 */
export type TranslationRow = EntityRow | FieldRow

export type EntityRow = {
  _type: "entity"
  reference_id: string
  subRows: FieldRow[]
}

export type FieldRow = {
  _type: "field"
  reference_id: string
  field_name: string
}

export function isEntityRow(row: TranslationRow): row is EntityRow {
  return row._type === "entity"
}

export function isFieldRow(row: TranslationRow): row is FieldRow {
  return row._type === "field"
}

function initTranslationsFormState(
  translations: HttpTypes.AdminTranslation[],
  references: { id: string; [key: string]: string }[],
  availableLocales: AdminStoreLocale[],
  translatableFields: string[]
): TranslationsFormSchema {
  const existingMap = new Map<string, HttpTypes.AdminTranslation>()
  for (const t of translations) {
    existingMap.set(`${t.reference_id}:${t.locale_code}`, t)
  }

  const entitiesTranslationState: Record<string, EntityTranslationsSchema> = {}

  for (const reference of references) {
    const locales: Record<string, LocaleTranslationSchema> = {}

    for (const locale of availableLocales) {
      const key = `${reference.id}:${locale.locale_code}`
      const existing = existingMap.get(key)

      const fields: Record<string, string> = {}
      for (const fieldName of translatableFields) {
        const fieldValue = (existing?.translations?.[fieldName] as string) ?? ""
        fields[fieldName] = fieldValue
      }

      locales[locale.locale_code] = {
        id: existing?.id ?? null,
        locale_code: locale.locale_code,
        fields,
      }
    }

    entitiesTranslationState[reference.id] = { locales }
  }

  return {
    entities: entitiesTranslationState,
  }
}

function buildTranslationRows(
  references: { id: string; [key: string]: string }[],
  translatableFields: string[]
): TranslationRow[] {
  return references.map((reference) => ({
    _type: "entity" as const,
    reference_id: reference.id,
    subRows: translatableFields.map((fieldName) => ({
      _type: "field" as const,
      reference_id: reference.id,
      field_name: fieldName,
    })),
  }))
}

function transformToBatchPayload(
  currentState: TranslationsFormSchema,
  initialState: TranslationsFormSchema,
  entityType: string
): Required<HttpTypes.AdminBatchTranslations> {
  const payload: Required<HttpTypes.AdminBatchTranslations> = {
    create: [],
    update: [],
    delete: [],
  }

  for (const [entityId, entityData] of Object.entries(currentState.entities)) {
    for (const [localeCode, localeTranslations] of Object.entries(
      entityData.locales
    )) {
      const initial = initialState.entities[entityId]?.locales[localeCode]
      const hasContent = Object.values(localeTranslations.fields).some(
        (v) => v !== undefined && v.trim() !== ""
      )
      const hadContent =
        initial &&
        Object.values(initial.fields).some(
          (v) => v !== undefined && v.trim() !== ""
        )

      if (!localeTranslations.id && hasContent) {
        payload.create.push({
          reference_id: entityId,
          reference: entityType,
          locale_code: localeTranslations.locale_code,
          translations: localeTranslations.fields,
        })
      } else if (localeTranslations.id && hasContent) {
        // UPDATE: Has ID and has content - check if changed
        const hasChanged =
          !initial ||
          JSON.stringify(localeTranslations.fields) !==
            JSON.stringify(initial.fields)

        if (hasChanged) {
          payload.update.push({
            id: localeTranslations.id,
            translations: localeTranslations.fields,
          })
        }
      } else if (localeTranslations.id && !hasContent && hadContent) {
        payload.delete.push(localeTranslations.id)
      }
    }
  }

  return payload
}

function hasLocaleChanges(
  currentState: TranslationsFormSchema,
  initialState: TranslationsFormSchema,
  localeCode: string
): boolean {
  for (const [entityId, entityData] of Object.entries(currentState.entities)) {
    const currentLocale = entityData.locales[localeCode]
    const initialLocale = initialState.entities[entityId]?.locales[localeCode]

    if (!currentLocale || !initialLocale) {
      continue
    }

    for (const [fieldName, fieldValue] of Object.entries(
      currentLocale.fields
    )) {
      const initialValue = initialLocale.fields[fieldName] ?? ""
      const currentValue = fieldValue ?? ""

      if (currentValue !== initialValue) {
        return true
      }
    }
  }

  return false
}

function transformSingleLocaleToBatchPayload(
  currentState: TranslationsFormSchema,
  initialState: TranslationsFormSchema,
  entityType: string,
  localeCode: string
): Required<HttpTypes.AdminBatchTranslations> {
  const payload: Required<HttpTypes.AdminBatchTranslations> = {
    create: [],
    update: [],
    delete: [],
  }

  for (const [entityId, entityData] of Object.entries(currentState.entities)) {
    const localeTranslations = entityData.locales[localeCode]
    if (!localeTranslations) continue

    const initial = initialState.entities[entityId]?.locales[localeCode]
    const hasContent = Object.values(localeTranslations.fields).some(
      (v) => v !== undefined && v.trim() !== ""
    )
    const hadContent =
      initial &&
      Object.values(initial.fields).some(
        (v) => v !== undefined && v.trim() !== ""
      )

    if (!localeTranslations.id && hasContent) {
      payload.create.push({
        reference_id: entityId,
        reference: entityType,
        locale_code: localeTranslations.locale_code,
        translations: localeTranslations.fields,
      })
    } else if (localeTranslations.id && hasContent) {
      const hasChanged =
        !initial ||
        JSON.stringify(localeTranslations.fields) !==
          JSON.stringify(initial.fields)

      if (hasChanged) {
        payload.update.push({
          id: localeTranslations.id,
          translations: localeTranslations.fields,
        })
      }
    } else if (localeTranslations.id && !hasContent && hadContent) {
      payload.delete.push(localeTranslations.id)
    }
  }

  return payload
}

const columnHelper = createDataGridHelper<
  TranslationRow,
  TranslationsFormSchema
>()

const FIELD_COLUMN_WIDTH = 150

function useTranslationsGridColumns({
  entities,
  translatableFields,
  availableLocales,
  selectedLocale,
  dynamicColumnWidth,
}: {
  entities: { id: string; [key: string]: string }[]
  translatableFields: string[]
  availableLocales: AdminStoreLocale[]
  selectedLocale: string
  dynamicColumnWidth: number
}) {
  const { t } = useTranslation()

  const columns: ColumnDef<TranslationRow>[] = useMemo(() => {
    const selectedLocaleData = availableLocales.find(
      (l) => l.locale_code === selectedLocale
    )

    const baseColumns = [
      columnHelper.column({
        id: "field",
        name: "field",
        size: FIELD_COLUMN_WIDTH,
        header: undefined,
        cell: (context) => {
          const row = context.row.original

          if (isEntityRow(row)) {
            return (
              <DataGrid.ReadonlyCell context={context}></DataGrid.ReadonlyCell>
            )
          }

          return (
            <DataGrid.ReadonlyCell context={context} color="normal">
              <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                <span className="truncate">
                  {t(`fields.${row.field_name}`, {
                    defaultValue: row.field_name,
                  })}
                </span>
              </div>
            </DataGrid.ReadonlyCell>
          )
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: "original",
        name: "original",
        size: dynamicColumnWidth,
        header: t("general.original"),
        disableHiding: true,
        cell: (context) => {
          const row = context.row.original

          if (isEntityRow(row)) {
            return (
              <DataGrid.ReadonlyCell context={context}></DataGrid.ReadonlyCell>
            )
          }

          const entity = entities.find(
            (entity) => entity.id === row.reference_id
          )
          if (!entity) {
            return null
          }

          return (
            <DataGrid.ReadonlyCell context={context} isMultiLine>
              {entity[row.field_name]}
            </DataGrid.ReadonlyCell>
          )
        },
      }),
    ]

    if (selectedLocaleData) {
      baseColumns.push(
        columnHelper.column({
          id: selectedLocaleData.locale_code,
          name: selectedLocaleData.locale.name,
          size: dynamicColumnWidth,
          header: () => selectedLocaleData.locale.name,
          cell: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return <DataGrid.ReadonlyCell context={context} isMultiLine />
            }

            return <DataGrid.TextCell context={context} isMultiLine />
          },
          field: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return null
            }

            return `entities.${row.reference_id}.locales.${selectedLocaleData.locale_code}.fields.${row.field_name}`
          },
          type: "text",
        })
      )
    }

    return baseColumns
  }, [
    t,
    translatableFields,
    availableLocales,
    selectedLocale,
    entities,
    dynamicColumnWidth,
  ])

  return columns
}

type TranslationsEditFormProps = {
  translations: HttpTypes.AdminTranslation[]
  references: { id: string; [key: string]: string }[]
  entityType: string
  availableLocales: AdminStoreLocale[]
  translatableFields: string[]
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  referenceCount: number
}

export const TranslationsEditForm = ({
  translations,
  references,
  entityType,
  availableLocales,
  translatableFields,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  referenceCount,
}: TranslationsEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()

  const containerRef = useRef<HTMLDivElement>(null)
  const [dynamicColumnWidth, setDynamicColumnWidth] = useState(400)

  useEffect(() => {
    const calculateColumnWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const availableWidth = containerWidth - FIELD_COLUMN_WIDTH - 12
        const columnWidth = Math.max(300, Math.floor(availableWidth / 2))
        setDynamicColumnWidth(columnWidth)
      }
    }

    calculateColumnWidth()

    const resizeObserver = new ResizeObserver(calculateColumnWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  const [selectedLocale, setSelectedLocale] = useState<string>(
    availableLocales[0]?.locale_code ?? ""
  )

  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false)
  const [pendingLocale, setPendingLocale] = useState<string | null>(null)

  const entities = useMemo(() => references, [references])
  const totalCount = useMemo(
    () => referenceCount * (translatableFields.length + 1),
    [referenceCount, translatableFields]
  )

  const initialState = useRef(
    initTranslationsFormState(
      translations,
      entities,
      availableLocales,
      translatableFields
    )
  )

  const form = useForm<TranslationsFormSchema>({
    resolver: zodResolver(TranslationsFormSchema),
    defaultValues: initialState.current,
  })

  const rows = useMemo(
    () => buildTranslationRows(entities, translatableFields),
    [entities, translatableFields]
  )

  const { mutateAsync, isPending } = useBatchTranslations(entityType)

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      if (newLocale === selectedLocale) {
        return
      }

      const currentValues = form.getValues()
      const hasChanges = hasLocaleChanges(
        currentValues,
        initialState.current,
        selectedLocale
      )

      if (hasChanges) {
        setPendingLocale(newLocale)
        setShowUnsavedPrompt(true)
      } else {
        setSelectedLocale(newLocale)
      }
    },
    [selectedLocale, form]
  )

  const saveCurrentLocale = useCallback(async () => {
    const currentValues = form.getValues()
    const payload = transformSingleLocaleToBatchPayload(
      currentValues,
      initialState.current,
      entityType,
      selectedLocale
    )

    if (
      payload.create.length === 0 &&
      payload.update.length === 0 &&
      payload.delete.length === 0
    ) {
      return true
    }

    try {
      const BATCH_SIZE = 150
      const totalItems =
        payload.create.length + payload.update.length + payload.delete.length
      const batchCount = Math.ceil(totalItems / BATCH_SIZE)

      for (let i = 0; i < batchCount; i++) {
        let currentBatchAvailable = BATCH_SIZE
        const currentBatch: HttpTypes.AdminBatchTranslations = {
          create: [],
          update: [],
          delete: [],
        }
        if (payload.create.length > 0) {
          currentBatch.create = payload.create.splice(0, currentBatchAvailable)
          currentBatchAvailable -= currentBatch.create.length
        }
        if (payload.update.length > 0) {
          currentBatch.update = payload.update.splice(0, currentBatchAvailable)
          currentBatchAvailable -= currentBatch.update.length
        }
        if (payload.delete.length > 0) {
          currentBatch.delete = payload.delete.splice(0, currentBatchAvailable)
          currentBatchAvailable -= currentBatch.delete.length
        }

        await mutateAsync(currentBatch)
      }

      const updatedInitialState = { ...initialState.current }
      for (const entityId of Object.keys(currentValues.entities)) {
        if (updatedInitialState.entities[entityId]?.locales[selectedLocale]) {
          updatedInitialState.entities[entityId].locales[selectedLocale] = {
            ...currentValues.entities[entityId].locales[selectedLocale],
          }
        }
      }
      initialState.current = updatedInitialState
      form.reset(currentValues)

      return true
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save translations"
      )
      return false
    }
  }, [form, entityType, selectedLocale, mutateAsync])

  const handleSaveAndSwitch = useCallback(async () => {
    const success = await saveCurrentLocale()
    if (success && pendingLocale) {
      toast.success(
        t("translations.edit.localeChangesSaved", {
          defaultValue: "Changes saved successfully",
        })
      )
      setSelectedLocale(pendingLocale)
    }
    setShowUnsavedPrompt(false)
    setPendingLocale(null)
  }, [saveCurrentLocale, pendingLocale, t])

  const handleCancelSwitch = useCallback(() => {
    setShowUnsavedPrompt(false)
    setPendingLocale(null)
  }, [])

  const handleSave = useCallback(
    async (closeOnSuccess: boolean = false) => {
      const success = await saveCurrentLocale()
      if (success) {
        toast.success(
          t("translations.edit.successToast", {
            defaultValue: "Translations updated successfully",
          })
        )
        if (closeOnSuccess) {
          handleSuccess()
        }
      }
    },
    [saveCurrentLocale, t, handleSuccess]
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = transformToBatchPayload(
      values,
      initialState.current,
      entityType
    )

    if (
      payload.create.length === 0 &&
      payload.update.length === 0 &&
      payload.delete.length === 0
    ) {
      toast.info(
        t("translations.noChanges", { defaultValue: "No changes to save" })
      )
      return
    }

    const BATCH_SIZE = 150
    const totalItems =
      payload.create.length + payload.update.length + payload.delete.length
    const batchCount = Math.ceil(totalItems / BATCH_SIZE)

    for (let i = 0; i < batchCount; i++) {
      let currentBatchAvailable = BATCH_SIZE
      const currentBatch: HttpTypes.AdminBatchTranslations = {
        create: [],
        update: [],
        delete: [],
      }
      if (payload.create.length > 0) {
        currentBatch.create = payload.create.splice(0, currentBatchAvailable)
        currentBatchAvailable -= currentBatch.create.length
      }
      if (payload.update.length > 0) {
        currentBatch.update = payload.update.splice(0, currentBatchAvailable)
        currentBatchAvailable -= currentBatch.update.length
      }
      if (payload.delete.length > 0) {
        currentBatch.delete = payload.delete.splice(0, currentBatchAvailable)
        currentBatchAvailable -= currentBatch.delete.length
      }

      await mutateAsync(currentBatch, {
        onSuccess: () => {
          if (i === batchCount - 1) {
            toast.success(
              t("translations.edit.successToast", {
                defaultValue: "Translations updated successfully",
              })
            )
            handleSuccess()
          }
        },
        onError: (error) => {
          toast.error(error.message)
        },
      })
    }
  })

  const columns = useTranslationsGridColumns({
    entities,
    translatableFields,
    availableLocales,
    selectedLocale,
    dynamicColumnWidth,
  })

  const selectedLocaleDisplay = availableLocales.find(
    (l) => l.locale_code === selectedLocale
  )?.locale.name

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header>
          <div className="-my-2 flex w-full items-center justify-between border-l px-4">
            <Select
              value={selectedLocale}
              onValueChange={handleLocaleChange}
              size="small"
            >
              <Select.Trigger className="bg-ui-bg-base w-[200px]">
                <Select.Value>{selectedLocaleDisplay}</Select.Value>
              </Select.Trigger>
              <Select.Content>
                {availableLocales.map((locale) => (
                  <Select.Item
                    key={locale.locale_code}
                    value={locale.locale_code}
                  >
                    {locale.locale.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body className="size-full overflow-hidden">
          <div ref={containerRef} className="size-full">
            <DataGrid
              columns={columns}
              data={rows}
              getSubRows={(row) => {
                if (isEntityRow(row)) {
                  return row.subRows
                }
              }}
              state={form}
              onEditingChange={(editing) => setCloseOnEscape(!editing)}
              totalRowCount={totalCount}
              onFetchMore={fetchNextPage}
              isFetchingMore={isFetchingNextPage}
              hasNextPage={hasNextPage}
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="button"
              variant="secondary"
              onClick={() => handleSave(false)}
              isLoading={isPending}
            >
              {t("actions.saveChanges", { defaultValue: "Save changes" })}
            </Button>
            <Button
              size="small"
              type="button"
              onClick={() => handleSave(true)}
              isLoading={isPending}
            >
              {t("actions.saveAndClose", { defaultValue: "Save and close" })}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>

      <Prompt open={showUnsavedPrompt} variant="confirmation">
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>
              {t("translations.unsavedChanges.title", {
                defaultValue: "Unsaved changes",
              })}
            </Prompt.Title>
            <Prompt.Description>
              {t("translations.unsavedChanges.description", {
                defaultValue:
                  "You have unsaved changes for this locale. Save them before switching?",
              })}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Button
              size="small"
              variant="secondary"
              onClick={handleCancelSwitch}
              type="button"
            >
              {t("actions.close")}
            </Button>
            <Button
              size="small"
              onClick={handleSaveAndSwitch}
              type="button"
              isLoading={isPending}
            >
              {t("actions.saveChanges", { defaultValue: "Save changes" })}
            </Button>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </RouteFocusModal.Form>
  )
}
