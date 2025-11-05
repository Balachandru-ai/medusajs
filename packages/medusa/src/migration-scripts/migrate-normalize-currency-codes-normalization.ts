import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { ExecArgs } from "@medusajs/types";

const updatePricesStep = createStep(
    "update-prices",
    async (_, { container }) => {
        const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

        await knex('price')
            .update({currency_code: knex.raw("LOWER(currency_code)")})
    }
)

const normalizeCurrencyCodesWorkflow = createWorkflow(
    'normalize-currency-codes',
    () => {
        updatePricesStep()

        return new WorkflowResponse(void 0)
    }
)

export default async function migrateNormalizeCurrencyCodes({ container }: ExecArgs) {
    await normalizeCurrencyCodesWorkflow(container).run()
}