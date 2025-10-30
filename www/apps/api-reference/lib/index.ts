"use server"

import OpenAPIParser from "@readme/openapi-parser"
import path from "path"
import { OpenAPI } from "types"
import getPathsOfTag from "../utils/get-paths-of-tag"

export async function getBaseSpecs(area: OpenAPI.Area, expand?: string) {
  if (area !== "admin" && area !== "store") {
    throw new Error(`area ${area} is not allowed`)
  }
  const baseSpecs = (await OpenAPIParser.parse(
    path.join(process.cwd(), "specs", area, "openapi.yaml")
  )) as OpenAPI.ExpandedDocument

  if (expand) {
    const paths = await getPathsOfTag(expand, area)
    if (paths) {
      baseSpecs.expandedTags = {}
      baseSpecs.expandedTags[expand] = paths.paths
    }
  }

  return baseSpecs
}
