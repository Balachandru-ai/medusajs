import { zodResolver } from "@hookform/resolvers/zod"
import { AdminStoreLocale, HttpTypes } from "@medusajs/types"
import { Button, ProgressTabs, toast } from "@medusajs/ui"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo, useRef } from "react"
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
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"

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

const columnHelper = createDataGridHelper<
  TranslationRow,
  TranslationsFormSchema
>()

function useTranslationsGridColumns({
  entities,
  translatableFields,
  availableLocales,
  modalFields = [],
}: {
  entities: { id: string; [key: string]: string }[]
  translatableFields: string[]
  availableLocales: AdminStoreLocale[]
  modalFields?: string[]
}) {
  const { t } = useTranslation()

  const columns: ColumnDef<TranslationRow>[] = useMemo(() => {
    return [
      columnHelper.column({
        id: "field",
        name: "field",
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
        size: 300,
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
            <DataGrid.ReadonlyCell context={context}>
              {entity[row.field_name]}
            </DataGrid.ReadonlyCell>
          )
        },
      }),
      ...availableLocales.map((locale) => {
        return columnHelper.column({
          id: locale.locale_code,
          name: locale.locale.name,
          size: 300,
          header: () => locale.locale.name,
          cell: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return (
                <DataGrid.ReadonlyCell
                  context={context}
                ></DataGrid.ReadonlyCell>
              )
            }

            const useModal = modalFields.includes(row.field_name)

            if (useModal) {
              return (
                <DataGrid.ExpandableTextCell
                  context={context}
                  fieldLabel={row.field_name}
                />
              )
            }

            return <DataGrid.TextCell context={context} />
          },
          field: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return null
            }

            return `entities.${row.reference_id}.locales.${locale.locale_code}.fields.${row.field_name}`
          },
          type: "text",
        })
      }),
    ]
  }, [t, translatableFields, availableLocales, modalFields])

  return columns
}

type TranslationsEditFormProps = {
  translations: HttpTypes.AdminTranslation[]
  references: { id: string; [key: string]: string }[]
  entityType: string
  availableLocales: AdminStoreLocale[]
  translatableFields: string[]
  modalFields?: string[]
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
  modalFields = [],
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  referenceCount,
}: TranslationsEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const direction = useDocumentDirection()

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
    modalFields,
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <ProgressTabs
          dir={direction}
          defaultValue={entityType}
          className="flex h-full flex-col overflow-hidden"
        >
          <RouteFocusModal.Header>
            <div className="-my-2 w-full border-l">
              <ProgressTabs.List className="justify-start-start flex w-full items-center">
                <ProgressTabs.Trigger value={entityType}>
                  {entityType
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </ProgressTabs.Trigger>
              </ProgressTabs.List>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body className="size-full overflow-hidden">
            <ProgressTabs.Content
              value={entityType}
              className="size-full overflow-y-auto"
            >
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
            </ProgressTabs.Content>
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
              <Button size="small" type="submit" isLoading={isPending}>
                {t("actions.save")}
              </Button>
            </div>
          </RouteFocusModal.Footer>
        </ProgressTabs>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
