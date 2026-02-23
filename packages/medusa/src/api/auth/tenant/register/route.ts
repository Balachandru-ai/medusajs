import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { tenantSignupWorkflow } from "../../../../workflows/tenant-signup"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { store_name, subdomain, admin_email, first_name, last_name } = req.body as any

  const { result } = await tenantSignupWorkflow(req.scope).run({
    input: {
      store_name,
      subdomain,
      admin_email,
      first_name,
      last_name,
    },
  })

  res.status(201).json({ result })
}
