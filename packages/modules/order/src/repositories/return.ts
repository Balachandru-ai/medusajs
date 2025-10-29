import { DALUtils } from "@medusajs/framework/utils"
import { Return } from "#models/return"
import { setFindMethods } from "../utils/base-repository-find"

export class ReturnRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  Return
) {}

setFindMethods(ReturnRepository, Return)
