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
  const filters = isString(idOrFilter) ? { id: idOrFilter } : idOrFilter
  let context: object = {}

  if ("context" in filters) {
    if (filters.context) {
      context = filters.context!
    }

    delete filters.context
  }

  return (await query.graph(
    {
      entity: entryPoint as string,
      fields,
      filters,
      context,
      pagination,
      withDeleted,
    },
    options
  )) as Omit<GraphResultSet<TEntry>, "metadata"> & {
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
