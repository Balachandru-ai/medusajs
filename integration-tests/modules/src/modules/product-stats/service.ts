import { MedusaService } from "@medusajs/utils"
import ProductStats from "./models/product-stats"

export class ProductStatsModuleService extends MedusaService({
  ProductStats,
}) {}
