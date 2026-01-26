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

export const adminPropertyLabelsMiddlewares: MiddlewareRoute[] = [
  // List property labels
  {
    matcher: "/admin/property-labels",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(
        AdminPropertyLabelListParams,
        QueryConfig.defaultPropertyLabelFields
      ),
    ],
  },
  // Create property label
  {
    matcher: "/admin/property-labels",
    method: "POST",
    middlewares: [
      validateAndTransformBody(AdminCreatePropertyLabel),
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.defaultPropertyLabelFields
      ),
    ],
  },
  // Get single property label
  {
    matcher: "/admin/property-labels/:id",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.defaultPropertyLabelFields
      ),
    ],
  },
  // Update property label
  {
    matcher: "/admin/property-labels/:id",
    method: "POST",
    middlewares: [
      validateAndTransformBody(AdminUpdatePropertyLabel),
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.defaultPropertyLabelFields
      ),
    ],
  },
  // Delete property label
  {
    matcher: "/admin/property-labels/:id",
    method: "DELETE",
    middlewares: [],
  },
  // Batch operations
  {
    matcher: "/admin/property-labels/batch",
    method: "POST",
    middlewares: [
      validateAndTransformBody(AdminBatchPropertyLabels),
      validateAndTransformQuery(
        AdminPropertyLabelParams,
        QueryConfig.defaultPropertyLabelFields
      ),
    ],
  },
]
