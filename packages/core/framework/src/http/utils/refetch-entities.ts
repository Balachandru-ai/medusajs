import type {
  GraphResultSet,
  MedusaContainer,
  RemoteJoinerOptions,
  RemoteQueryFunctionReturnPagination,
} from "../../types"
import { ContainerRegistrationKeys, isString } from "../../utils"
import type { MedusaRequest } from "../types"

export const refetchEntities = async <TEntry extends string>(
  entryPoint: TEntry,
  idOrFilter: string | object,
  scope: MedusaContainer,
  fields: string[],
  pagination?: MedusaRequest["queryConfig"]["pagination"],
  withDeleted?: boolean,
  options?: RemoteJoinerOptions
): Promise<
  Omit<GraphResultSet<TEntry>, "metadata"> & {
    metadata: RemoteQueryFunctionReturnPagination
  }
> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  let filters = isString(idOrFilter) ? { id: idOrFilter } : idOrFilter
  let context!: Record<string, unknown>

  if ("context" in filters) {
    const { context: context_, ...rest } = filters
    if (context_) {
      context = context_! as Record<string, unknown>
    }
    filters = rest
  }

  const graphOptions: Parameters<typeof query.graph>[0] = {
    entity: entryPoint as string,
    fields,
    filters,
    pagination,
    withDeleted,
    context: context,
  }

  return (await query.graph(graphOptions, options)) as Omit<
    GraphResultSet<TEntry>,
    "metadata"
  > & {
    metadata: RemoteQueryFunctionReturnPagination
  }
}

export const refetchEntity = async (
  entryPoint: string,
  idOrFilter: string | object,
  scope: MedusaContainer,
  fields: string[],
  options?: RemoteJoinerOptions
) => {
  const { data } = await refetchEntities(
    entryPoint,
    idOrFilter,
    scope,
    fields,
    undefined,
    undefined,
    options
  )

  return Array.isArray(data) ? data[0] : data
}
