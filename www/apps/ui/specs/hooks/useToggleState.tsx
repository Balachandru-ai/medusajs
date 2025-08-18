import { HookTable } from "@/components/HookTable"
import { useToggleState } from "../hook-values"

const Props = () => {
  return <HookTable props={useToggleState} />
}

export default Props
