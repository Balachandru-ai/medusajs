import { Container, Heading, Button, Badge } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { useEntities } from "../../../hooks/api/views"

export const PropertyLabelsList = () => {
  const { t } = useTranslation()
  const { entities, isLoading, isError, error } = useEntities()

  if (isError) {
    throw error
  }

  if (isLoading || !entities) {
    return <div>Loading...</div>
  }

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <Heading level="h1">
          {t("propertyLabels.title", "Property Labels")}
        </Heading>
      </div>
      <div className="text-ui-fg-subtle mb-4">
        {t(
          "propertyLabels.description",
          "Customize the display names for entity properties across the admin dashboard."
        )}
      </div>

      <div className="divide-y">
        {entities?.map((entity) => (
          <div
            key={entity.name}
            className="flex items-center justify-between py-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{entity.pluralName}</span>
                {entity.hasOverrides && (
                  <Badge size="xsmall" color="blue">
                    {t("propertyLabels.customized", "Customized")}
                  </Badge>
                )}
              </div>
              <div className="text-ui-fg-subtle mt-1 text-sm">
                {t("propertyLabels.propertyCount", "{{count}} properties", {
                  count: entity.propertyCount,
                })}
                {" • "}
                {t("propertyLabels.module", "Module: {{module}}", {
                  module: entity.module,
                })}
              </div>
            </div>
            <Button size="small" variant="secondary" asChild>
              <Link to={`/settings/property-labels/${entity.name}`}>
                <PencilSquare />
                {t("actions.edit", "Edit")}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </Container>
  )
}
