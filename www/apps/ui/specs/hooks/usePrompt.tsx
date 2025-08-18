import { HookTable } from "@/components/HookTable"
import { usePrompt } from "../hook-values"

const Props = () => {
  return <HookTable props={usePrompt} />
}

export default Props
