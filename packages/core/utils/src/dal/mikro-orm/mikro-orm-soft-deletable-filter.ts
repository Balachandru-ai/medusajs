import { raw } from "@mikro-orm/core"

export const SoftDeletableFilterKey = "softDeletable"

// @ts-ignore
interface FilterArguments {
  withDeleted?: boolean
}

export const mikroOrmSoftDeletableFilterOptions = {
  name: SoftDeletableFilterKey,
  cond: (...args: any[]) => {
    // @ts-ignore
    const [args_, type, em, options, entityName] = args
    const { withDeleted } = args_ ?? {}
    if (withDeleted) {
      return {}
    }
    return Object.values(options.populate || {}).some(
      (p: any) => p.strategy !== "joined"
    )
      ? {}
      : {
          [raw((alias) => {
            return `${alias}.deleted_at`
          })]: null,
        }
  },
  default: true,
  args: false,
}
