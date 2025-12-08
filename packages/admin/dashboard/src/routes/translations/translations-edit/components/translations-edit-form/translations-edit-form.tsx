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
 * Schema for a single locale translation (subrow in DataGrid).
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
 * Parent rows are entities, subrows are locale translations.
 */
export type TranslationRow = EntityRow | LocaleRow

export type EntityRow = {
  _type: "entity"
  reference_id: string
  subRows: LocaleRow[]
}

export type LocaleRow = {
  _type: "locale"
  reference_id: string
  locale_code: string
  locale_name: string
  id?: string
}

export function isEntityRow(row: TranslationRow): row is EntityRow {
  return row._type === "entity"
}

export function isLocaleRow(row: TranslationRow): row is LocaleRow {
  return row._type === "locale"
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
      const isDefaultLocale = locale.is_default

      const fields: Record<string, string> = {}
      for (const fieldName of translatableFields) {
        const fieldValue = isDefaultLocale
          ? (existing?.translations?.[fieldName] as string) ??
            reference[fieldName]
          : (existing?.translations?.[fieldName] as string) ?? ""
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
  availableLocales: AdminStoreLocale[],
  translations: HttpTypes.AdminTranslation[]
): TranslationRow[] {
  // Index existing translations by reference_id:locale_code
  const existingMap = new Map<string, HttpTypes.AdminTranslation>()
  for (const t of translations) {
    existingMap.set(`${t.reference_id}:${t.locale_code}`, t)
  }

  return references.map((reference) => ({
    _type: "entity" as const,
    reference_id: reference.id,
    subRows: availableLocales.map((locale) => {
      const key = `${reference.id}:${locale.locale_code}`
      const existing = existingMap.get(key)
      return {
        _type: "locale" as const,
        reference_id: reference.id,
        locale_code: locale.locale_code,
        locale_name: locale.locale.name,
        id: existing?.id,
      }
    }),
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
  translatableFields,
}: {
  translatableFields: string[]
}) {
  const { t } = useTranslation()

  const columns: ColumnDef<TranslationRow>[] = useMemo(() => {
    return [
      columnHelper.column({
        id: "name",
        header: t("fields.name"),
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
                <span className="truncate">{row.locale_name}</span>
              </div>
            </DataGrid.ReadonlyCell>
          )
        },
        disableHiding: true,
      }),
      ...translatableFields.map((fieldName) =>
        columnHelper.column({
          id: fieldName,
          header: t(`fields.${fieldName}`, { defaultValue: fieldName }),
          cell: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return (
                <DataGrid.ReadonlyCell context={context}>
                  <span className="text-ui-fg-muted">—</span>
                </DataGrid.ReadonlyCell>
              )
            }

            return <DataGrid.TextCell context={context} />
          },
          field: (context) => {
            const row = context.row.original

            if (isEntityRow(row)) {
              return null
            }

            return `entities.${row.reference_id}.locales.${row.locale_code}.fields.${fieldName}`
          },
          type: "text",
        })
      ),
    ]
  }, [t, translatableFields])

  return columns
}

type TranslationsEditFormProps = {
  translations: HttpTypes.AdminTranslation[]
  references: { id: string; [key: string]: string }[]
  entityType: string
  availableLocales: AdminStoreLocale[]
  translatableFields: string[]
}

export const TranslationsEditForm = ({
  translations,
  references,
  entityType,
  availableLocales,
  translatableFields,
}: TranslationsEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const direction = useDocumentDirection()

  const entities = useMemo(() => references, [references])

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
    () => buildTranslationRows(entities, availableLocales, translations),
    [entities, availableLocales, translations]
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

    await mutateAsync(payload, {
      onSuccess: () => {
        toast.success(
          t("translations.edit.successToast", {
            defaultValue: "Translations updated successfully",
          })
        )
        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  const columns = useTranslationsGridColumns({ translatableFields })

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
                  {entityType}
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
