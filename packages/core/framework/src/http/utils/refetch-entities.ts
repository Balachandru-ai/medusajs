import type { MedusaContainer, RemoteJoinerOptions } from "../../types"
import { ContainerRegistrationKeys, isString } from "../../utils"
import { MedusaRequest } from "../types"

export const refetchEntities = async (
  entryPoint: string,
  idOrFilter: string | object,
  scope: MedusaContainer,
  fields: string[],
  pagination?: MedusaRequest["queryConfig"]["pagination"],
  withDeleted?: boolean,
  options?: RemoteJoinerOptions
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const filters = isString(idOrFilter) ? { id: idOrFilter } : idOrFilter
  let context: object = {}

  if ("context" in filters) {
    if (filters.context) {
      context = filters.context!
    }

    delete filters.context
  }

  const { data } = await query.graph(
    {
      entity: entryPoint,
      fields,
      filters,
      context,
      pagination,
      withDeleted,
    },
    options
  )

  return data
}

export const refetchEntity = async (
  entryPoint: string,
  idOrFilter: string | object,
  scope: MedusaContainer,
  fields: string[],
  options?: RemoteJoinerOptions
) => {
  const data = await refetchEntities(
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
