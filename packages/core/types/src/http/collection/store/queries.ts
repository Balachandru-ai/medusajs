import { BaseFilterable } from "../../../dal"
import { BaseCollectionListParams, BaseCollectionParams } from "../common"

export interface StoreCollectionListParams
  extends BaseCollectionListParams,
    BaseFilterable<StoreCollectionListParams> {}

export interface StoreCollectionParams extends BaseCollectionParams {}
