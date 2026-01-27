import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/framework/http"
import * as QueryConfig from "./query-config"
import {
  AdminPropertyLabelParams,
  AdminPropertyLabelListParams,
  AdminCreatePropertyLabel,
  AdminUpdatePropertyLabel,
  AdminBatchPropertyLabels,
} from "./validators"
import { ensureViewConfigurationsEnabled } from "../views/[entity]/configurations/middleware"

export const adminPropertyLabelsMiddlewares: MiddlewareRoute[] = [
  // List property labels
  {
    matcher: "/admin/property-labels",
    method: "GET",
    middlewares: [
      ensureViewConfigurationsEnabled,
      validateAndTransformQuery(
        AdminPropertyLabelListParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  // Create property label
  {
    matcher: "/admin/property-labels",
    method: "POST",
    middlewares: [
      ensureViewConfigurationsEnabled,
      validateAndTransformBody(AdminCreatePropertyLabel),
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  // Get single property label
  {
    matcher: "/admin/property-labels/:id",
    method: "GET",
    middlewares: [
      ensureViewConfigurationsEnabled,
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  // Update property label
  {
    matcher: "/admin/property-labels/:id",
    method: "POST",
    middlewares: [
      ensureViewConfigurationsEnabled,
      validateAndTransformBody(AdminUpdatePropertyLabel),
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  // Delete property label
  {
    matcher: "/admin/property-labels/:id",
    method: "DELETE",
    middlewares: [ensureViewConfigurationsEnabled],
  },
  // Batch operations
  {
    matcher: "/admin/property-labels/batch",
    method: "POST",
    middlewares: [
      ensureViewConfigurationsEnabled,
      validateAndTransformBody(AdminBatchPropertyLabels),
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
]
