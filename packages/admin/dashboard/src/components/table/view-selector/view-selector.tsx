import React, { useEffect, useState } from "react"
import { 
  Select,
  Button,
  Tooltip,
  DropdownMenu,
  Badge,
  usePrompt,
  toast,
} from "@medusajs/ui"
import { 
  Eye,
  EyeSlash,
  Plus,
  Trash,
  PencilSquare,
  Star,
  CheckCircleSolid,
  ArrowUturnLeft,
} from "@medusajs/icons"
import { useViewConfiguration } from "../../../providers/view-configuration-provider"
import { ViewConfiguration } from "../../../providers/view-configuration-provider"
import { SaveViewDialog } from "../save-view-dialog"

interface ViewSelectorProps {
  entity: string
  onViewChange?: (view: ViewConfiguration | null) => void
  currentColumns?: {
    visible: string[]
    order: string[]
  }
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  entity,
  onViewChange,
  currentColumns,
}) => {
  const {
    getViewConfigurations,
    getActiveView,
    setActiveView,
    deleteViewConfiguration,
    isLoading,
  } = useViewConfiguration()

  const [views, setViews] = useState<ViewConfiguration[]>([])
  const [activeView, setActiveViewState] = useState<ViewConfiguration | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [editingView, setEditingView] = useState<ViewConfiguration | null>(null)
  const prompt = usePrompt()

  // Load views and active view
  useEffect(() => {
    const loadData = async () => {
      const [viewsList, active] = await Promise.all([
        getViewConfigurations(entity),
        getActiveView(entity),
      ])
      setViews(viewsList)
      setActiveViewState(active)
      if (active && onViewChange) {
        onViewChange(active)
      }
    }
    loadData()
  }, [entity])

  const handleViewSelect = async (viewId: string) => {
    const view = views.find(v => v.id === viewId)
    if (view) {
      await setActiveView(entity, viewId)
      setActiveViewState(view)
      if (onViewChange) {
        onViewChange(view)
      }
      toast.success(`Switched to view: ${view.name}`)
    }
  }

  const handleDeleteView = async (view: ViewConfiguration) => {
    const result = await prompt({
      title: "Delete view",
      description: `Are you sure you want to delete "${view.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (result) {
      try {
        await deleteViewConfiguration(view.id)
        setViews(views.filter(v => v.id !== view.id))
        if (activeView?.id === view.id) {
          setActiveViewState(null)
          if (onViewChange) {
            onViewChange(null)
          }
        }
        toast.success("View deleted successfully")
      } catch (error) {
        toast.error("Failed to delete view")
      }
    }
  }

  const handleSaveView = () => {
    setSaveDialogOpen(true)
    setEditingView(null)
  }

  const handleEditView = (view: ViewConfiguration) => {
    setEditingView(view)
    setSaveDialogOpen(true)
  }

  const handleResetSystemDefault = async (systemDefaultView: ViewConfiguration) => {
    const result = await prompt({
      title: "Reset system default",
      description: "This will delete the saved system default and revert to the original code-level defaults. All users will be affected. Are you sure?",
      confirmText: "Reset",
      cancelText: "Cancel",
    })

    if (result) {
      try {
        await deleteViewConfiguration(systemDefaultView.id)
        setViews(views.filter(v => v.id !== systemDefaultView.id))
        if (activeView?.id === systemDefaultView.id) {
          setActiveViewState(null)
          if (onViewChange) {
            onViewChange(null)
          }
        }
        toast.success("System default reset to code-level defaults")
      } catch (error) {
        toast.error("Failed to reset system default")
      }
    }
  }

  const systemDefaultView = views.find(v => v.is_system_default)
  const personalViews = views.filter(v => !v.is_system_default)

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary" size="small">
              <Eye className="h-4 w-4" />
              {activeView ? activeView.name : "Default View"}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="w-[260px]">
            {systemDefaultView && (
              <>
                <DropdownMenu.Label>System Default</DropdownMenu.Label>
                <DropdownMenu.Item
                  onClick={() => handleViewSelect(systemDefaultView.id)}
                  className="justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {systemDefaultView.name || "System Default"}
                  </span>
                  <div className="flex items-center gap-1">
                    {activeView?.id === systemDefaultView.id && (
                      <CheckCircleSolid className="h-4 w-4 text-ui-fg-positive" />
                    )}
                    <div className="opacity-0 group-hover:opacity-100">
                      <Tooltip content="Reset to code defaults">
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResetSystemDefault(systemDefaultView)
                          }}
                        >
                          <ArrowUturnLeft className="h-3 w-3" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </DropdownMenu.Item>
                {personalViews.length > 0 && <DropdownMenu.Separator />}
              </>
            )}

            {personalViews.length > 0 && (
              <>
                <DropdownMenu.Label>Personal Views</DropdownMenu.Label>
                {personalViews.map((view) => (
                  <DropdownMenu.Item
                    key={view.id}
                    onClick={() => handleViewSelect(view.id)}
                    className="justify-between group"
                  >
                    <span className="flex-1">{view.name}</span>
                    <div className="flex items-center gap-1">
                      {activeView?.id === view.id && (
                        <CheckCircleSolid className="h-4 w-4 text-ui-fg-positive" />
                      )}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <Tooltip content="Edit view">
                          <Button
                            variant="transparent"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditView(view)
                            }}
                          >
                            <PencilSquare className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete view">
                          <Button
                            variant="transparent"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteView(view)
                            }}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </>
            )}

            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onClick={handleSaveView}
              className="text-ui-fg-interactive"
            >
              <Plus className="h-4 w-4" />
              Save current view
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      {saveDialogOpen && (
        <SaveViewDialog
          entity={entity}
          currentColumns={currentColumns}
          editingView={editingView}
          onClose={() => {
            setSaveDialogOpen(false)
            setEditingView(null)
          }}
          onSaved={(newView) => {
            setViews([...views.filter(v => v.id !== newView.id), newView])
            setSaveDialogOpen(false)
            setEditingView(null)
            toast.success(`View "${newView.name}" saved successfully`)
          }}
        />
      )}
    </>
  )
}