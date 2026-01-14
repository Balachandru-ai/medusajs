import { Collapse, DescendingSorting } from "@medusajs/icons"
import { Button, clx, IconButton, Input } from "@medusajs/ui"
import { SegmentedControl } from "../../../../../components/common/segmented-control"

type ViewMode = "full" | "selected"

type SelectorTreeFilterProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  onSelectAll: () => void
  onSortToggle: () => void
  onCollapseAll: () => void
  className?: string
}

export const SelectorTreeFilter = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onSelectAll,
  onSortToggle,
  onCollapseAll,
  className,
}: SelectorTreeFilterProps) => {
  return (
    <div className={clx("flex items-center gap-x-2", className)}>
      <div className="flex-1">
        <Input
          size="small"
          type="search"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      <SegmentedControl
        value={viewMode}
        onValueChange={(value) => onViewModeChange(value as ViewMode)}
        options={[
          { value: "full", label: "Full list" },
          { value: "selected", label: "Selected" },
        ]}
      />
      <Button onClick={onSelectAll} size="small" variant="secondary">
        Select all
      </Button>
      <IconButton size="small" onClick={onSortToggle}>
        <DescendingSorting />
      </IconButton>
      <IconButton size="small" onClick={onCollapseAll}>
        <Collapse />
      </IconButton>
    </div>
  )
}
