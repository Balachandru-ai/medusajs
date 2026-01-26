import { useLoaderData, useParams } from "react-router-dom"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useCustomer } from "../../../hooks/api/customers"
import { useExtension } from "../../../providers/extension-provider"
import {
  PermissionsRequirementsProvider,
  useRequiredPermissions,
} from "../../../providers/permissions-provider"
import { CustomerAddressSection } from "./components/customer-address-section/customer-address-section"
import { CustomerGeneralSection } from "./components/customer-general-section"
import { CustomerGroupSection } from "./components/customer-group-section"
import { CustomerOrderSection } from "./components/customer-order-section"
import { customerLoader } from "./loader"

export const CustomerDetail = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof customerLoader>
  >
  const { customer, isLoading, isError, error } = useCustomer(
    id!,
    { fields: "+*addresses" },
    { initialData }
  )

  const { getWidgets } = useExtension()

  if (isLoading || !customer) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <PermissionsRequirementsProvider>
      <TwoColumnPage
        widgets={{
          before: getWidgets("customer.details.before"),
          after: getWidgets("customer.details.after"),
          sideAfter: getWidgets("customer.details.side.after"),
          sideBefore: getWidgets("customer.details.side.before"),
        }}
        data={customer}
        hasOutlet
        showJSON
        showMetadata
        requiredPermissionsSection={<CustomerRequiredPermissions />}
      >
        <TwoColumnPage.Main>
          <CustomerGeneralSection customer={customer} />
          <CustomerOrderSection customer={customer} />
          <CustomerGroupSection customer={customer} />
        </TwoColumnPage.Main>
        <TwoColumnPage.Sidebar>
          <CustomerAddressSection customer={customer} />
        </TwoColumnPage.Sidebar>
      </TwoColumnPage>
    </PermissionsRequirementsProvider>
  )
}

const CustomerRequiredPermissions = () => {
  const { t } = useTranslation()
  const requirements = useRequiredPermissions()

  if (!requirements.length) {
    return (
      <Container className="flex flex-col gap-y-2 px-6 py-4">
        <Heading level="h2">
          {t("permissions.requiredPermissions.title")}
        </Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t("permissions.requiredPermissions.none")}
        </Text>
      </Container>
    )
  }

  return (
    <Container className="flex flex-col gap-y-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">
          {t("permissions.requiredPermissions.title")}
        </Heading>
        <Badge size="2xsmall" rounded="full">
          {requirements.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-y-3">
        {requirements.map((requirement) => {
          const key = [
            requirement.requireAll ? "all" : "any",
            requirement.permissions.join("|"),
            requirement.source || "",
          ].join("::")

          return (
            <div key={key} className="flex flex-col gap-y-2">
              <Text size="small" className="text-ui-fg-subtle">
                {requirement.requireAll
                  ? t("permissions.requiredPermissions.allOf")
                  : t("permissions.requiredPermissions.anyOf")}
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {requirement.permissions.map((permission) => (
                  <Badge key={permission} size="2xsmall">
                    {permission}
                  </Badge>
                ))}
              </div>
              {requirement.source && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  {t("permissions.requiredPermissions.source", {
                    source: requirement.source,
                  })}
                </Text>
              )}
            </div>
          )
        })}
      </div>
    </Container>
  )
}
