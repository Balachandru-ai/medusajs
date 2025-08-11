import { useContext } from "react"
import { ViewConfigurationContext } from "./view-configuration-context"

export const useViewConfiguration = () => {
  const context = useContext(ViewConfigurationContext)

  if (!context) {
    throw new Error(
      "useViewConfiguration must be used within a ViewConfigurationProvider"
    )
  }

  return context
}