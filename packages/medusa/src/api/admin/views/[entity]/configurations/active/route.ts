import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  AdminSetActiveViewConfigurationType,
  AdminGetActiveViewConfigurationParamsType,
} from "../validators"
import { HttpTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * @ignore
 * 
 * @privateRemarks
 * Remove the `ignore` tag once the feature is ready. Otherwise,
 * it will be generated in the documentation.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetActiveViewConfigurationParamsType>,
  res: MedusaResponse<
    HttpTypes.AdminViewConfigurationResponse & {
      is_default_active?: boolean
      default_type?: "system" | "code"
    }
  >
) => {
  const settingsService = req.scope.resolve(Modules.SETTINGS)

  const viewConfiguration = await settingsService.getActiveViewConfiguration(
    req.params.entity,
    req.auth_context.actor_id
  )

  if (!viewConfiguration) {
    // No active view set or explicitly cleared - return null
    res.json({
      view_configuration: null,
      is_default_active: true,
      default_type: "code",
    })
  } else {
    // Check if the user has an explicit preference
    const activeViewPref = await settingsService.getUserPreference(
      req.auth_context.actor_id,
      `active_view.${req.params.entity}`
    )

    // If there's no preference and the view is a system default, it means we're falling back to system default
    const isDefaultActive =
      !activeViewPref && viewConfiguration.is_system_default

    res.json({
      view_configuration: viewConfiguration,
      is_default_active: isDefaultActive,
      default_type:
        isDefaultActive && viewConfiguration.is_system_default
          ? "system"
          : undefined,
    })
  }
}

/**
 * @ignore
 * 
 * @privateRemarks
 * Remove the `ignore` tag once the feature is ready. Otherwise,
 * it will be generated in the documentation.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSetActiveViewConfigurationType>,
  res: MedusaResponse<{ success: boolean }>
) => {
  const settingsService = req.scope.resolve(Modules.SETTINGS)

  if (req.body.view_configuration_id === null) {
    // Clear the active view configuration
    await settingsService.clearActiveViewConfiguration(
      req.params.entity,
      req.auth_context.actor_id
    )
  } else {
    // Set a specific view as active
    await settingsService.setActiveViewConfiguration(
      req.params.entity,
      req.auth_context.actor_id,
      req.body.view_configuration_id
    )
  }

  res.json({ success: true })
}
