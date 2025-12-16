import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [store],
  } = await query.graph({
    entity: "store",
    fields: ["supported_locales.*", "supported_locales.locale.*"],
    pagination: {
      take: 1,
    },
  })

  const locales = store?.supported_locales.reduce((acc, locale) => {
    acc.push({
      code: locale.locale_code,
      name: locale.locale.name,
    })
    return acc
  }, [])

  res.json({
    locales,
  })
}
