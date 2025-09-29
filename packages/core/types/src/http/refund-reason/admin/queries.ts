import { BaseFilterable, OperatorMap } from "../../../dal"
import { SelectParams } from "../../common"
import { BaseRefundReasonListParams } from "../common"

export interface AdminRefundReasonListParams
  extends BaseRefundReasonListParams,
    BaseFilterable<AdminRefundReasonListParams> {
  /**
   * Apply filters on the refund reason's deletion date.
   */
  deleted_at?: OperatorMap<string>
}

export interface AdminRefundReasonParams extends SelectParams {}
