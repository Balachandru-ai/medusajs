import { Constructor, Context, DAL } from "@medusajs/framework/types"
import { toMikroORMEntity } from "@medusajs/framework/utils"
import { LoadStrategy } from "@medusajs/framework/mikro-orm/core"
import { Order, OrderClaim, OrderLineItemAdjustment } from "@models"

import { mapRepositoryToOrderModel } from "."
import {
  buildPaymentStatusCaseExpression,
  buildFulfillmentStatusCaseExpression,
} from "./status-subqueries"

export function setFindMethods<T>(klass: Constructor<T>, entity: any) {
  klass.prototype.find = async function find(
    this: any,
    options?: DAL.FindOptions<T>,
    context?: Context
  ): Promise<T[]> {
    const manager = this.getActiveManager(context)
    const knex = manager.getKnex()

    const findOptions_ = { ...options } as any
    findOptions_.options ??= {}
    findOptions_.where ??= {}

    // Extract status filters before processing
    const paymentStatusFilter = findOptions_.where.payment_status
    const fulfillmentStatusFilter = findOptions_.where.fulfillment_status
    const hasStatusFilters = paymentStatusFilter || fulfillmentStatusFilter

    // Remove status filters from where clause to prevent errors
    delete findOptions_.where.payment_status
    delete findOptions_.where.fulfillment_status

    if (!("strategy" in findOptions_.options)) {
      if (findOptions_.options.limit != null || findOptions_.options.offset) {
        Object.assign(findOptions_.options, {
          strategy: LoadStrategy.SELECT_IN,
        })
      }
    }

    const isRelatedEntity = entity.name !== Order.name

    // Only apply status filtering for Order entity (not related entities)
    if (hasStatusFilters && !isRelatedEntity) {
      // Use custom query with status filtering
      return await findWithStatusFilters(
        manager,
        knex,
        findOptions_,
        paymentStatusFilter,
        fulfillmentStatusFilter,
        this.entity,
        context
      )
    }

    const config = mapRepositoryToOrderModel(findOptions_, isRelatedEntity)
    config.options ??= {}
    config.options.populate ??= []

    const strategy = findOptions_.options.strategy ?? LoadStrategy.JOINED
    let orderAlias = "o0"
    if (isRelatedEntity) {
      if (entity === OrderClaim) {
        config.options.populate.push("claim_items")
      }

      if (strategy === LoadStrategy.JOINED) {
        config.options.populate.push("order.shipping_methods")
        config.options.populate.push("order.summary")
        config.options.populate.push("shipping_methods")
      }

      if (!config.options.populate.includes("order.items")) {
        config.options.populate.unshift("order.items")
      }

      // first relation is always order if the entity is not Order
      const index = config.options.populate.findIndex((p) => p === "order")
      if (index > -1) {
        config.options.populate.splice(index, 1)
      }

      config.options.populate.unshift("order")
      orderAlias = "o1"
    }

    let defaultVersion = knex.raw(`"${orderAlias}"."version"`)

    if (strategy === LoadStrategy.SELECT_IN) {
      const sql = manager
        .qb(toMikroORMEntity(Order), "_sub0")
        .select("version")
        .where({ id: knex.raw(`"${orderAlias}"."order_id"`) })
        .getKnexQuery()
        .toString()

      defaultVersion = knex.raw(`(${sql})`)
    }

    const version = config.where?.version ?? defaultVersion
    delete config.where?.version

    configurePopulateWhere(config, isRelatedEntity, version)

    let loadAdjustments = false
    if (config.options.populate.includes("items.item.adjustments")) {
      // TODO: handle if populate is an object
      loadAdjustments = true
      config.options.populate.splice(
        config.options.populate.indexOf("items.item.adjustments"),
        1
      )

      config.options.populate.push("items")
      config.options.populate.push("items.item")

      // make sure version is loaded if adjustments are requested
      if (config.options.fields?.some((f) => f.includes("items.item."))) {
        config.options.fields.push(
          isRelatedEntity ? "order.items.version" : "items.version"
        )
      }
    }

    if (!config.options.orderBy) {
      config.options.orderBy = { id: "ASC" }
    }

    config.where ??= {}

    const result = await manager.find(this.entity, config.where, config.options)

    if (loadAdjustments) {
      const orders = !isRelatedEntity
        ? [...result]
        : [...result].map((r) => r.order).filter(Boolean)

      await loadItemAdjustments(manager, orders)
    }

    return result
  }

  klass.prototype.findAndCount = async function findAndCount(
    this: any,
    findOptions: DAL.FindOptions<T> = { where: {} } as DAL.FindOptions<T>,
    context: Context = {}
  ): Promise<[T[], number]> {
    const manager = this.getActiveManager(context)
    const knex = manager.getKnex()

    const findOptions_ = { ...findOptions } as any
    findOptions_.options ??= {}
    findOptions_.where ??= {}

    // Extract status filters before processing
    const paymentStatusFilter = findOptions_.where.payment_status
    const fulfillmentStatusFilter = findOptions_.where.fulfillment_status
    const hasStatusFilters = paymentStatusFilter || fulfillmentStatusFilter

    // Remove status filters from where clause to prevent errors
    delete findOptions_.where.payment_status
    delete findOptions_.where.fulfillment_status

    if (!("strategy" in findOptions_.options)) {
      Object.assign(findOptions_.options, {
        strategy: LoadStrategy.SELECT_IN,
      })
    }

    const isRelatedEntity = entity.name !== Order.name

    // Only apply status filtering for Order entity (not related entities)
    if (hasStatusFilters && !isRelatedEntity) {
      // Use custom query with CTEs for status filtering
      return await findAndCountWithStatusFilters(
        manager,
        knex,
        findOptions_,
        paymentStatusFilter,
        fulfillmentStatusFilter,
        this.entity,
        context
      )
    }

    const config = mapRepositoryToOrderModel(findOptions_, isRelatedEntity)

    let orderAlias = "o0"
    if (isRelatedEntity) {
      if (entity === OrderClaim) {
        if (
          config.options.populate.includes("additional_items") &&
          !config.options.populate.includes("claim_items")
        ) {
          config.options.populate.push("claim_items")
        }
      }

      const index = config.options.populate.findIndex((p) => p === "order")
      if (index > -1) {
        config.options.populate.splice(index, 1)
      }

      config.options.populate.unshift("order")
      orderAlias = "o1"
    }

    let defaultVersion = knex.raw(`"${orderAlias}"."version"`)
    const strategy = config.options.strategy ?? LoadStrategy.JOINED
    if (strategy === LoadStrategy.SELECT_IN) {
      defaultVersion = getVersionSubQuery(manager, orderAlias)
    }

    const version = config.where.version ?? defaultVersion
    delete config.where.version

    let loadAdjustments = false
    if (config.options.populate.includes("items.item.adjustments")) {
      loadAdjustments = true
      config.options.populate.splice(
        config.options.populate.indexOf("items.item.adjustments"),
        1
      )

      config.options.populate.push("items")
      config.options.populate.push("items.item")

      // make sure version is loaded if adjustments are requested
      if (config.options.fields?.some((f) => f.includes("items.item."))) {
        config.options.fields.push(
          isRelatedEntity ? "order.items.version" : "items.version"
        )
      }
    }

    configurePopulateWhere(
      config,
      isRelatedEntity,
      version,
      strategy === LoadStrategy.SELECT_IN,
      manager
    )

    if (!config.options.orderBy) {
      config.options.orderBy = { id: "ASC" }
    }

    const [result, count] = await manager.findAndCount(
      this.entity,
      config.where,
      config.options
    )

    if (loadAdjustments) {
      const orders = !isRelatedEntity
        ? [...result]
        : [...result].map((r) => r.order).filter(Boolean)

      await loadItemAdjustments(manager, orders)
    }

    return [result, count]
  }
}

/**
 * Custom find implementation that supports filtering by calculated status fields
 * Uses SQL subqueries to filter orders by payment_status and fulfillment_status at the database level
 */
async function findWithStatusFilters(
  manager,
  knex,
  findOptions_,
  paymentStatusFilter,
  fulfillmentStatusFilter,
  entity,
  context
) {
  const isRelatedEntity = false // Always false when this function is called

  const config = mapRepositoryToOrderModel(findOptions_, isRelatedEntity)
  config.options ??= {}
  config.options.populate ??= []

  const strategy = findOptions_.options?.strategy ?? LoadStrategy.JOINED
  let orderAlias = "o0"

  let defaultVersion = knex.raw(`"${orderAlias}"."version"`)
  if (strategy === LoadStrategy.SELECT_IN) {
    const sql = manager
      .qb(toMikroORMEntity(Order), "_sub0")
      .select("version")
      .where({ id: knex.raw(`"${orderAlias}"."order_id"`) })
      .getKnexQuery()
      .toString()

    defaultVersion = knex.raw(`(${sql})`)
  }

  const version = config.where?.version ?? defaultVersion
  delete config.where?.version

  configurePopulateWhere(config, isRelatedEntity, version)

  let loadAdjustments = false
  if (config.options.populate.includes("items.item.adjustments")) {
    loadAdjustments = true
    config.options.populate.splice(
      config.options.populate.indexOf("items.item.adjustments"),
      1
    )

    config.options.populate.push("items")
    config.options.populate.push("items.item")

    if (config.options.fields?.some((f) => f.includes("items.item."))) {
      config.options.fields.push("items.version")
    }
  }

  if (!config.options.orderBy) {
    config.options.orderBy = { id: "ASC" }
  }

  config.where ??= {}

  // Build and execute the subquery that filters orders by status
  const statusFilterQuery = `
    SELECT DISTINCT o.id
    FROM "order" o
    WHERE o.id IN (
      SELECT o2.id FROM "order" o2
      WHERE 1=1
      ${paymentStatusFilter ? `AND ${buildPaymentStatusCaseExpression(knex, 'o2').toString()} IN (${
        Array.isArray(paymentStatusFilter)
          ? paymentStatusFilter.map(() => '?').join(',')
          : '?'
      })` : ''}
      ${fulfillmentStatusFilter ? `AND ${buildFulfillmentStatusCaseExpression(knex, 'o2').toString()} IN (${
        Array.isArray(fulfillmentStatusFilter)
          ? fulfillmentStatusFilter.map(() => '?').join(',')
          : '?'
      })` : ''}
    )
  `
  
  const statusFilterParams = [
    ...(paymentStatusFilter ? (Array.isArray(paymentStatusFilter) ? paymentStatusFilter : [paymentStatusFilter]) : []),
    ...(fulfillmentStatusFilter ? (Array.isArray(fulfillmentStatusFilter) ? fulfillmentStatusFilter : [fulfillmentStatusFilter]) : []),
  ]
  
  // Execute the query to get filtered IDs
  const filteredIdsResult = await knex.raw(statusFilterQuery, statusFilterParams)
  const filteredIds = filteredIdsResult.rows.map((row: any) => row.id)
  
  // Add the filtered IDs to the where clause
  if (filteredIds.length === 0) {
    // No matching orders, use a non-existent ID to return empty results
    config.where.id = '__no_match__'
  } else {
    config.where.id = filteredIds
  }

  const result = await manager.find(entity, config.where, config.options)

  if (loadAdjustments) {
    await loadItemAdjustments(manager, result)
  }

  return result
}

/**
 * Custom findAndCount implementation that supports filtering by calculated status fields
 * Uses SQL CTEs to filter orders by payment_status and fulfillment_status at the database level
 */
async function findAndCountWithStatusFilters(
  manager,
  knex,
  findOptions_,
  paymentStatusFilter,
  fulfillmentStatusFilter,
  entity,
  context
): Promise<[any[], number]> {
  const isRelatedEntity = false // Always false when this function is called

  const config = mapRepositoryToOrderModel(findOptions_, isRelatedEntity)

  let orderAlias = "o0"
  const strategy = config.options?.strategy ?? LoadStrategy.SELECT_IN

  let defaultVersion = knex.raw(`"${orderAlias}"."version"`)
  if (strategy === LoadStrategy.SELECT_IN) {
    defaultVersion = getVersionSubQuery(manager, orderAlias)
  }

  const version = config.where?.version ?? defaultVersion
  delete config.where?.version

  let loadAdjustments = false
  if (config.options?.populate?.includes("items.item.adjustments")) {
    loadAdjustments = true
    config.options.populate.splice(
      config.options.populate.indexOf("items.item.adjustments"),
      1
    )

    config.options.populate.push("items")
    config.options.populate.push("items.item")

    if (config.options.fields?.some((f) => f.includes("items.item."))) {
      config.options.fields.push("items.version")
    }
  }

  configurePopulateWhere(
    config,
    isRelatedEntity,
    version,
    strategy === LoadStrategy.SELECT_IN,
    manager
  )

  if (!config.options?.orderBy) {
    config.options = config.options || {}
    config.options.orderBy = { id: "ASC" }
  }

  // Build and execute the subquery that filters orders by status
  const statusFilterQuery = `
    SELECT DISTINCT o.id
    FROM "order" o
    WHERE o.id IN (
      SELECT o2.id FROM "order" o2
      WHERE 1=1
      ${paymentStatusFilter ? `AND ${buildPaymentStatusCaseExpression(knex, 'o2').toString()} IN (${
        Array.isArray(paymentStatusFilter)
          ? paymentStatusFilter.map(() => '?').join(',')
          : '?'
      })` : ''}
      ${fulfillmentStatusFilter ? `AND ${buildFulfillmentStatusCaseExpression(knex, 'o2').toString()} IN (${
        Array.isArray(fulfillmentStatusFilter)
          ? fulfillmentStatusFilter.map(() => '?').join(',')
          : '?'
      })` : ''}
    )
  `
  
  const statusFilterParams = [
    ...(paymentStatusFilter ? (Array.isArray(paymentStatusFilter) ? paymentStatusFilter : [paymentStatusFilter]) : []),
    ...(fulfillmentStatusFilter ? (Array.isArray(fulfillmentStatusFilter) ? fulfillmentStatusFilter : [fulfillmentStatusFilter]) : []),
  ]
  
  // Execute the query to get filtered IDs
  const filteredIdsResult = await knex.raw(statusFilterQuery, statusFilterParams)
  const filteredIds = filteredIdsResult.rows.map((row: any) => row.id)
  
  // Add the filtered IDs to the where clause
  config.where = config.where || {}
  if (filteredIds.length === 0) {
    // No matching orders, use a non-existent ID to return empty results
    config.where.id = '__no_match__'
  } else {
    config.where.id = filteredIds
  }

  const [result, count] = await manager.findAndCount(
    entity,
    config.where,
    config.options
  )

  if (loadAdjustments) {
    await loadItemAdjustments(manager, result)
  }

  return [result, count]
}

/**
 * Load adjustment for the lates items/order version
 * @param manager MikroORM manager
 * @param orders Orders to load adjustments for
 */
async function loadItemAdjustments(manager, orders) {
  const items = orders.flatMap((r) => [...(r.items ?? [])])
  const itemsIdMap = new Map<string, any>(items.map((i) => [i.item.id, i.item]))

  if (!items.length) {
    return
  }

  const params = items.map((i) => {
    // preinitialise all items so an empty array is returned for ones without adjustments
    if (!i.item.adjustments.isInitialized()) {
      i.item.adjustments.initialized = true
    }

    if (!i.version) {
      throw new Error("Item version is required to load adjustments")
    }
    return {
      item_id: i.item.id,
      version: i.version,
    }
  })

  const adjustments = await manager.find(OrderLineItemAdjustment, {
    $or: params,
  })

  for (const adjustment of adjustments) {
    const item = itemsIdMap.get(adjustment.item_id)
    if (item) {
      item.adjustments.add(adjustment)
    }
  }
}

function getVersionSubQuery(manager, alias, field = "order_id") {
  const knex = manager.getKnex()
  const sql = manager
    .qb(toMikroORMEntity(Order), "_sub0")
    .select("version")
    .where({ id: knex.raw(`"${alias}"."${field}"`) })
    .getKnexQuery()
    .toString()

  return knex.raw(`(${sql})`)
}

function configurePopulateWhere(
  config: any,
  isRelatedEntity: boolean,
  version: any,
  isSelectIn = false,
  manager?
) {
  const requestedPopulate = config.options?.populate ?? []
  const hasRelation = (relation: string) =>
    requestedPopulate.some(
      (p) => p === relation || p.startsWith(`${relation}.`)
    )

  config.options.populateWhere ??= {}
  const popWhere = config.options.populateWhere

  // isSelectIn && isRelatedEntity - Order is always the FROM clause (field o0.id)
  if (isRelatedEntity) {
    popWhere.order ??= {}

    const popWhereOrder = popWhere.order

    popWhereOrder.version = isSelectIn
      ? getVersionSubQuery(manager, "o0", "id")
      : version

    // related entity shipping method
    if (hasRelation("shipping_methods")) {
      popWhere.shipping_methods ??= {}
      popWhere.shipping_methods.version = isSelectIn
        ? getVersionSubQuery(manager, "s0")
        : version
    }

    if (hasRelation("items") || hasRelation("order.items")) {
      popWhereOrder.items ??= {}
      popWhereOrder.items.version = isSelectIn
        ? getVersionSubQuery(manager, "o0", "id")
        : version
    }

    if (hasRelation("shipping_methods")) {
      popWhereOrder.shipping_methods ??= {}
      popWhereOrder.shipping_methods.version = isSelectIn
        ? getVersionSubQuery(manager, "o0", "id")
        : version
    }

    return
  }

  if (isSelectIn) {
    version = getVersionSubQuery(manager, "o0")
  }

  if (hasRelation("summary")) {
    popWhere.summary ??= {}
    popWhere.summary.version = version
  }

  if (hasRelation("credit_lines")) {
    popWhere.credit_lines ??= {}
    popWhere.credit_lines.version = version
  }

  if (hasRelation("items") || hasRelation("order.items")) {
    popWhere.items ??= {}
    popWhere.items.version = version
  }

  if (hasRelation("shipping_methods")) {
    popWhere.shipping_methods ??= {}
    popWhere.shipping_methods.version = version
  }
}
