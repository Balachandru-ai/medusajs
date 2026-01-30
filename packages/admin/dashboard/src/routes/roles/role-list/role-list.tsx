import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"
import { RoleListTable } from "./components/role-list-table"

export const RoleList = () => {
  const { getWidgets } = useExtension()
  const isRbacEnabled = useFeatureFlag("rbac")
  const navigate = useNavigate()

  useEffect(() => {
    if (!isRbacEnabled) {
      navigate(-1)
    }
  }, [isRbacEnabled, navigate])

  if (!isRbacEnabled) {
    return null
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("role.list.before"),
        after: getWidgets("role.list.after"),
      }}
    >
      <RoleListTable />
    </SingleColumnPage>
  )
}
