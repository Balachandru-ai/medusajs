import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { FilterableProductProps } from "@medusajs/types"
import { normalizeForExport } from "../helpers/normalize-for-export"
import { json2csv } from "json-2-csv"

export type ExportProductsStepInput = {
  /**
   * The fields to select. These fields will be passed to
   * [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query), so you can
   * pass product properties or any relation names, including custom links.
   */
  select: string[]
  /**
   * The filters to select which products to export.
   */
  filter?: FilterableProductProps
  batch_size?: number | string
}

export const exportProductsStepId = "export-products"

const DEFAULT_BATCH_SIZE = 50

export const exportProductsStep = createStep(
  exportProductsStepId,
  async (input: ExportProductsStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const fileModule = container.resolve(Modules.FILE)
    const regionModule = container.resolve(Modules.REGION)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const regions = await regionModule.listRegions(
      {},
      { select: ["id", "name", "currency_code"] }
    )

    const filename = `${Date.now()}-products-export.csv`
    const { writeStream, promise, fileKey } = await fileModule.getUploadStream({
      filename,
      mimeType: "text/csv",
    })

    const pageSize = !isNaN(parseInt(input?.batch_size as string))
      ? parseInt(input?.batch_size as string, 10)
      : DEFAULT_BATCH_SIZE

    let page = 0
    let hasHeader = false

    while (true) {
      logger.info(
        `Exporting products page ${page} of ${pageSize} memory usage: ${
          process.memoryUsage().heapUsed / 1024 / 1024
        } MB`
      )
      const { data: products } = await query.graph({
        entity: "product",
        fields: input.select,
        filters: input.filter,
        pagination: {
          skip: page * pageSize,
          take: pageSize,
        },
      })

      if (products.length === 0) {
        break
      }

      logger.info(
        `Before normalization memory usage: ${
          process.memoryUsage().heapUsed / 1024 / 1024
        } MB`
      )
      const normalizedProducts = normalizeForExport(products, { regions })
      logger.info(
        `After normalization memory usage: ${
          process.memoryUsage().heapUsed / 1024 / 1024
        } MB`
      )

      logger.info(
        `Before csv conversion memory usage: ${
          process.memoryUsage().heapUsed / 1024 / 1024
        } MB`
      )
      const batchCsv = json2csv(normalizedProducts, {
        prependHeader: !hasHeader,
        arrayIndexesAsKeys: true,
        expandNestedObjects: true,
        expandArrayObjects: true,
        unwindArrays: false,
        preventCsvInjection: true,
        emptyFieldValue: "",
      })
      logger.info(
        `After csv conversion memory usage: ${
          process.memoryUsage().heapUsed / 1024 / 1024
        } MB`
      )

      const ok = writeStream.write((hasHeader ? "\n" : "") + batchCsv)
      if (!ok) {
        await new Promise((resolve) => writeStream.once("drain", resolve))
      }

      hasHeader = true

      if (products.length < pageSize) {
        break
      }

      page += 1
    }

    logger.info(
      `Before write stream end memory usage: ${
        process.memoryUsage().heapUsed / 1024 / 1024
      } MB`
    )

    writeStream.end()

    await promise

    return new StepResponse({ id: fileKey, filename }, fileKey)
  },
  async (fileId, { container }) => {
    if (!fileId) {
      return
    }

    const fileModule = container.resolve(Modules.FILE)
    await fileModule.deleteFiles(fileId)
  }
)
