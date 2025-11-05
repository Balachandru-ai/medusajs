import InventoryItem from "#models/inventory-item"
import InventoryLevel from "#models/inventory-level"
import ReservationItem from "#models/reservation-item"

import { defineMikroOrmCliConfig, Modules } from "@medusajs/framework/utils"

export default defineMikroOrmCliConfig(Modules.INVENTORY, {
  entities: [InventoryItem, InventoryLevel, ReservationItem],
})
