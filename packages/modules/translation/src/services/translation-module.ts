import { MedusaService } from "@medusajs/framework/utils"
import Locale from "../models/locale"
import Translation from "../models/translation"

export default class TranslationModuleService extends MedusaService({
  Locale,
  Translation,
}) {}
