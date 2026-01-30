import { useEffect } from "react"
import { useLoaderData, useNavigate, useParams } from "react-router-dom"

import { useRbacRole } from "../../../hooks/api/rbac-roles"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"
import { RoleGeneralSection } from "./components/role-general-section"
import { roleLoader } from "./loader"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { ROLE_DETAIL_FIELDS } from "./constants"

export const RoleDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof roleLoader>>
  const { id } = useParams()
  const { getWidgets } = useExtension()
  const isRbacEnabled = useFeatureFlag("rbac")
  const navigate = useNavigate()

  useEffect(() => {
    if (!isRbacEnabled) {
      navigate(-1)
    }
  }, [isRbacEnabled, navigate])

  const {
    role,
    isPending: isLoading,
    isError,
    error,
  } = useRbacRole(
    id!,
    { fields: ROLE_DETAIL_FIELDS },
    {
      initialData,
      enabled: !!id && isRbacEnabled,
    }
  )

  if (!isRbacEnabled) {
    return null
  }

  if (isLoading || !role) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      data={role}
      showJSON
      showMetadata
      widgets={{
        before: getWidgets("role.details.before"),
        after: getWidgets("role.details.after"),
      }}
    >
      <RoleGeneralSection role={role} />
    </SingleColumnPage>
  )
}
