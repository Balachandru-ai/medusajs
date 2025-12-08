import {
  FilterableOrderProps,
  IFileModuleService,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  deduplicate,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { json2csv } from "json-2-csv"
import { normalizeOrdersForExport } from "../helpers/normalize-for-export"
import {
  getLastFulfillmentStatus,
  getLastPaymentStatus,
} from "../utils/aggregate-status"

export type ExportOrdersStepInput = {
  batch_size?: number | string
  select: string[]
  filter?: FilterableOrderProps
}

export type ExportOrdersStepOutput = {
  id: string
  filename: string
}

export const exportOrdersStepId = "export-orders"

const orderColumnPositions = new Map([
  ["Order Id", 0],
  ["Order Display Id", 1],
  ["Order Status", 2],
  ["Order Created At", 3],
  ["Order Updated At", 4],
  ["Order Currency Code", 5],
  ["Order Region Id", 6],
  ["Order Email", 7],
  ["Order Subtotal", 8],
  ["Order Tax Total", 9],
  ["Order Shipping Total", 10],
  ["Order Discount Total", 11],
  ["Order Gift Card Total", 12],
  ["Order Total", 13],
])

const customerColumnPositions = new Map([
  ["Customer Id", 0],
  ["Customer Email", 1],
  ["Customer First Name", 2],
  ["Customer Last Name", 3],
  ["Customer Phone", 4],
])

const addressColumnPositions = new Map([
  ["First Name", 0],
  ["Last Name", 1],
  ["Company", 2],
  ["Address 1", 3],
  ["Address 2", 4],
  ["City", 5],
  ["Province", 6],
  ["Postal Code", 7],
  ["Country Code", 8],
  ["Phone", 9],
])

const comparator = (a: string, b: string, columnMap: Map<string, number>) => {
  if (columnMap.has(a) && columnMap.has(b)) {
    return columnMap.get(a)! - columnMap.get(b)!
  }
  if (columnMap.has(a)) {
    return -1
  }
  if (columnMap.has(b)) {
    return 1
  }
  return a.localeCompare(b)
}

const csvSortFunction = (a: string, b: string) => {
  // Order fields first
  if (a.startsWith("Order") && b.startsWith("Order")) {
    return comparator(a, b, orderColumnPositions)
  }
  if (a.startsWith("Order") && !b.startsWith("Order")) {
    return -1
  }
  if (!a.startsWith("Order") && b.startsWith("Order")) {
    return 1
  }

  // Customer fields
  if (a.startsWith("Customer") && b.startsWith("Customer")) {
    return comparator(a, b, customerColumnPositions)
  }
  if (a.startsWith("Customer") && !b.startsWith("Customer")) {
    return -1
  }
  if (!a.startsWith("Customer") && b.startsWith("Customer")) {
    return 1
  }

  // Shipping address fields
  if (a.startsWith("Shipping Address") && b.startsWith("Shipping Address")) {
    const aKey = a.replace("Shipping Address ", "")
    const bKey = b.replace("Shipping Address ", "")
    return comparator(aKey, bKey, addressColumnPositions)
  }
  if (a.startsWith("Shipping Address") && !b.startsWith("Shipping Address")) {
    return -1
  }
  if (!a.startsWith("Shipping Address") && b.startsWith("Shipping Address")) {
    return 1
  }

  // Sales channel fields
  if (a.startsWith("Sales Channel") && !b.startsWith("Sales Channel")) {
    return -1
  }
  if (!a.startsWith("Sales Channel") && b.startsWith("Sales Channel")) {
    return 1
  }

  // Item fields - sort by item number
  if (a.startsWith("Item") && b.startsWith("Item")) {
    const aMatch = a.match(/Item (\d+)/)
    const bMatch = b.match(/Item (\d+)/)
    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[1], 10)
      const bNum = parseInt(bMatch[1], 10)
      if (aNum !== bNum) {
        return aNum - bNum
      }
    }
    return a.localeCompare(b)
  }
  if (a.startsWith("Item") && !b.startsWith("Item")) {
    return -1
  }
  if (!a.startsWith("Item") && b.startsWith("Item")) {
    return 1
  }

  // Shipping method fields
  if (a.startsWith("Shipping Method") && b.startsWith("Shipping Method")) {
    const aMatch = a.match(/Shipping Method (\d+)/)
    const bMatch = b.match(/Shipping Method (\d+)/)
    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[1], 10)
      const bNum = parseInt(bMatch[1], 10)
      if (aNum !== bNum) {
        return aNum - bNum
      }
    }
    return a.localeCompare(b)
  }
  if (a.startsWith("Shipping Method") && !b.startsWith("Shipping Method")) {
    return -1
  }
  if (!a.startsWith("Shipping Method") && b.startsWith("Shipping Method")) {
    return 1
  }

  return a.localeCompare(b)
}

export const exportOrdersStep = createStep(
  exportOrdersStepId,
  async (input: ExportOrdersStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const fileModule = container.resolve(Modules.FILE)

    const filename = `${Date.now()}-order-exports.csv`
    const { writeStream, promise, fileKey } = await fileModule.getUploadStream({
      filename,
      mimeType: "text/csv",
    })

    const pageSize = !isNaN(parseInt(input?.batch_size as string))
      ? parseInt(input?.batch_size as string, 10)
      : 50

    let page = 0
    let hasHeader = false

    const fields = deduplicate([
      ...input.select,
      "id",
      "status",
      "items.*",
      "payment_collections.status",
      "payment_collections.amount",
      "payment_collections.captured_amount",
      "payment_collections.refunded_amount",
      "fulfillments.packed_at",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
    ])

    while (true) {
      const { data: orders } = await query.graph({
        entity: "order",
        filters: {
          ...input.filter,
          status: {
            $ne: "draft",
          },
        },
        pagination: {
          skip: page * pageSize,
          take: pageSize,
        },
        fields,
      })

      if (orders.length === 0) {
        break
      }

      for (const order of orders) {
        const order_ = order as any

        order_.payment_status = getLastPaymentStatus(order_)
        order_.fulfillment_status = getLastFulfillmentStatus(order_)

        delete order_.version
        delete order.payment_collections
        delete order.fulfillments
      }

      const normalizedData = normalizeOrdersForExport(orders)
      const batchCsv = json2csv(normalizedData, {
        prependHeader: !hasHeader,
        sortHeader: csvSortFunction,
        arrayIndexesAsKeys: true,
        expandNestedObjects: true,
        expandArrayObjects: true,
        unwindArrays: false,
        preventCsvInjection: true,
        emptyFieldValue: "",
      })

      const ok = writeStream.write((hasHeader ? "\n" : "") + batchCsv)
      if (!ok) {
        await new Promise((resolve) => writeStream.once("drain", resolve))
      }

      hasHeader = true

      if (orders.length < pageSize) {
        break
      }

      page += 1
    }

    writeStream.end()

    await promise

    return new StepResponse(
      { id: fileKey, filename } as ExportOrdersStepOutput,
      fileKey
    )
  },
  async (fileId, { container }) => {
    if (!fileId) {
      return
    }

    const fileModule: IFileModuleService = container.resolve(Modules.FILE)
    await fileModule.deleteFiles(fileId)
  }
)
