import { SingleColumnPage } from "../../components/layout/pages"
import { PropertyLabelsList } from "./components/property-labels-list"

export const PropertyLabels = () => {
  return (
    <SingleColumnPage
      widgets={{
        before: [],
        after: [],
      }}
      hasOutlet
    >
      <PropertyLabelsList />
    </SingleColumnPage>
  )
}
