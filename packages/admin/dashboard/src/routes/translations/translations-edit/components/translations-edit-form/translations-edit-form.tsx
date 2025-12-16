import { zodResolver } from "@hookform/resolvers/zod"
import { AdminStoreLocale, HttpTypes } from "@medusajs/types"
import { Button, Prompt, Select, toast, Text } from "@medusajs/ui"
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
 * Schema for an entity's translations (parent row in DataGrid).
 * Contains all locale translations for that entity.
 */
const EntityTranslationsSchema = z.object({
  id: z.string().nullish(),
  fields: z.record(z.string().optional()),
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
  locale: AdminStoreLocale,
  translatableFields: string[]
): TranslationsFormSchema {
  const existingMap = new Map<string, HttpTypes.AdminTranslation>()
  const localeTranslations = translations.filter(
    (t) => t.locale_code === locale.locale_code
  )

  for (const t of localeTranslations) {
    existingMap.set(t.reference_id, t)
  }

  const entitiesTranslationState: Record<string, EntityTranslationsSchema> = {}

  for (const reference of references) {
    const existingReferenceTranslation = existingMap.get(reference.id)

    const fields: Record<string, string> = {}
    for (const fieldName of translatableFields) {
      const fieldValue =
        (existingReferenceTranslation?.translations?.[fieldName] as string) ??
        ""
      fields[fieldName] = fieldValue
    }

    entitiesTranslationState[reference.id] = {
      id: existingReferenceTranslation?.id ?? null,
      fields,
    }
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
  entityType: string,
  locale: AdminStoreLocale
): Required<HttpTypes.AdminBatchTranslations> {
  const payload: Required<HttpTypes.AdminBatchTranslations> = {
    create: [],
    update: [],
    delete: [],
  }

  for (const [entityId, entityData] of Object.entries(currentState.entities)) {
    const initial = initialState.entities[entityId]
    const hasContent = Object.values(entityData.fields).some(
      (v) => v !== undefined && v.trim() !== ""
    )

    const hadContent =
      initial &&
      Object.values(initial.fields).some(
        (v) => v !== undefined && v.trim() !== ""
      )

    if (!entityData.id && hasContent) {
      payload.create.push({
        reference_id: entityId,
        reference: entityType,
        locale_code: locale.locale_code,
        translations: entityData.fields,
      })
    } else if (entityData.id && hasContent) {
      const hasChanged =
        !initial ||
        JSON.stringify(entityData.fields) !== JSON.stringify(initial.fields)

      if (hasChanged) {
        payload.update.push({
          id: entityData.id,
          translations: entityData.fields,
        })
      }
    } else if (entityData.id && !hasContent && hadContent) {
      payload.delete.push(entityData.id)
    }
  }

  return payload
}

function hasLocaleChanges(
  currentState: TranslationsFormSchema,
  initialState: TranslationsFormSchema
): boolean {
  for (const [entityId, entityData] of Object.entries(currentState.entities)) {
    const initial = initialState.entities[entityId]

    for (const [fieldName, fieldValue] of Object.entries(entityData.fields)) {
      const initialValue = initial?.fields[fieldName] ?? ""
      const currentValue = fieldValue ?? ""

      if (currentValue !== initialValue) {
        return true
      }
    }
  }

  return false
}

const columnHelper = createDataGridHelper<
  TranslationRow,
  TranslationsFormSchema
>()

const FIELD_COLUMN_WIDTH = 350

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
                <Text
                  className="text-ui-fg-subtle truncate"
                  weight="plus"
                  size="small"
                >
                  {t(`fields.${row.field_name}`, {
                    defaultValue: row.field_name,
                  })}
                </Text>
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
        header: () => (
          <Text className="text-ui-fg-base" weight="plus" size="small">
            {t("general.original")}
          </Text>
        ),
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
            <DataGrid.ReadonlyCell color="normal" context={context} isMultiLine>
              <Text className="text-ui-fg-subtle" weight="plus" size="small">
                {entity[row.field_name]}
              </Text>
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
          header: () => (
            <Text className="text-ui-fg-base" weight="plus" size="small">
              {selectedLocaleData.locale.name}
            </Text>
          ),
          cell: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return <DataGrid.ReadonlyCell context={context} isMultiLine />
            }

            return <DataGrid.MultilineCell context={context} />
          },
          field: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return null
            }

            return `entities.${row.reference_id}.fields.${row.field_name}`
          },
          type: "multiline-text",
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
        const availableWidth = containerWidth - FIELD_COLUMN_WIDTH - 16
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
      availableLocales.find((l) => l.locale_code === selectedLocale) ??
        availableLocales[0]!,
      translatableFields
    )
  )

  useEffect(() => {
    const newState = initTranslationsFormState(
      translations,
      entities,
      availableLocales.find((l) => l.locale_code === selectedLocale) ??
        availableLocales[0]!,
      translatableFields
    )
    initialState.current = newState
    form.reset(newState)
  }, [selectedLocale])

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
      const hasChanges = hasLocaleChanges(currentValues, initialState.current)

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
    const payload = transformToBatchPayload(
      currentValues,
      initialState.current,
      entityType,
      availableLocales.find((l) => l.locale_code === selectedLocale) ??
        availableLocales[0]!
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

        const response = await mutateAsync(currentBatch, {
          onError: (error) => {
            toast.error(error.message)
          },
        })

        if (response.created) {
          for (const created of response.created) {
            form.setValue(`entities.${created.reference_id}.id`, created.id, {
              shouldDirty: false,
            })
            if (initialState.current.entities[created.reference_id]) {
              initialState.current.entities[created.reference_id].id =
                created.id
            }
          }
        }
      }

      const updatedInitialState = { ...initialState.current }
      for (const entityId of Object.keys(currentValues.entities)) {
        if (updatedInitialState.entities[entityId]) {
          updatedInitialState.entities[entityId] = {
            ...currentValues.entities[entityId],
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
      toast.success(t("translations.edit.successToast"))
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
        toast.success(t("translations.edit.successToast"))
        if (closeOnSuccess) {
          handleSuccess()
        }
      }
    },
    [saveCurrentLocale, t, handleSuccess]
  )

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
        onSubmit={() => handleSave(true)}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header></RouteFocusModal.Header>
        <RouteFocusModal.Body className="size-full overflow-hidden">
          <div ref={containerRef} className="size-full">
            <DataGrid
              showColumnsDropdown={false}
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
              headerContent={
                <Select
                  disabled={isPending}
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
              }
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                type="button"
                size="small"
                variant="secondary"
                isLoading={isPending}
              >
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
              {t("actions.saveChanges")}
            </Button>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.saveAndClose")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>

      <Prompt open={showUnsavedPrompt} variant="confirmation">
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>
              {t("translations.edit.unsavedChanges.title")}
            </Prompt.Title>
            <Prompt.Description>
              {t("translations.edit.unsavedChanges.description")}
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
              {t("actions.saveChanges")}
            </Button>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </RouteFocusModal.Form>
  )
}
