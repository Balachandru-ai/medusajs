import * as React from "react"

/**
 * @type {import("types").ExampleRegistry}
 */
export const ExampleRegistry = {
  "alert-demo": {
    name: "alert-demo",
    component: React.lazy(async () => import("@/specs/examples/alert-demo")),
    file: "specs/examples/alert-demo.tsx",
  },
  "alert-dismissable": {
    name: "alert-dismissable",
    component: React.lazy(
      async () => import("@/specs/examples/alert-dismissable")
    ),
    file: "specs/examples/alert-dismissable.tsx",
  },
  "alert-error": {
    name: "alert-error",
    component: React.lazy(async () => import("@/specs/examples/alert-error")),
    file: "specs/examples/alert-error.tsx",
  },
  "alert-success": {
    name: "alert-success",
    component: React.lazy(async () => import("@/specs/examples/alert-success")),
    file: "specs/examples/alert-success.tsx",
  },
  "alert-warning": {
    name: "alert-warning",
    component: React.lazy(async () => import("@/specs/examples/alert-warning")),
    file: "specs/examples/alert-warning.tsx",
  },
  "avatar-demo": {
    name: "avatar-demo",
    component: React.lazy(async () => import("@/specs/examples/avatar-demo")),
    file: "specs/examples/avatar-demo.tsx",
  },
  "badge-demo": {
    name: "badge-demo",
    component: React.lazy(async () => import("@/specs/examples/badge-demo")),
    file: "specs/examples/badge-demo.tsx",
  },
  "badge-blue": {
    name: "badge-blue",
    component: React.lazy(async () => import("@/specs/examples/badge-blue")),
    file: "specs/examples/badge-blue.tsx",
  },
  "badge-green": {
    name: "badge-green",
    component: React.lazy(async () => import("@/specs/examples/badge-green")),
    file: "specs/examples/badge-green.tsx",
  },
  "badge-red": {
    name: "badge-red",
    component: React.lazy(async () => import("@/specs/examples/badge-red")),
    file: "specs/examples/badge-red.tsx",
  },
  "badge-orange": {
    name: "badge-orange",
    component: React.lazy(async () => import("@/specs/examples/badge-orange")),
    file: "specs/examples/badge-orange.tsx",
  },
  "badge-purple": {
    name: "badge-purple",
    component: React.lazy(async () => import("@/specs/examples/badge-purple")),
    file: "specs/examples/badge-purple.tsx",
  },
  "badge-grey": {
    name: "badge-grey",
    component: React.lazy(async () => import("@/specs/examples/badge-grey")),
    file: "specs/examples/badge-grey.tsx",
  },
  "badge-small": {
    name: "badge-small",
    component: React.lazy(async () => import("@/specs/examples/badge-small")),
    file: "specs/examples/badge-small.tsx",
  },
  "badge-large": {
    name: "badge-large",
    component: React.lazy(async () => import("@/specs/examples/badge-large")),
    file: "specs/examples/badge-large.tsx",
  },
  "badge-rounded-full": {
    name: "badge-rounded-full",
    component: React.lazy(
      async () => import("@/specs/examples/badge-rounded-full")
    ),
    file: "specs/examples/badge-rounded-full.tsx",
  },
  "badge-rounded-base": {
    name: "badge-rounded-base",
    component: React.lazy(
      async () => import("@/specs/examples/badge-rounded-base")
    ),
    file: "specs/examples/badge-rounded-base.tsx",
  },
  "data-table-demo": {
    name: "data-table-demo",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-demo")
    ),
    file: "specs/examples/data-table-demo.tsx",
  },
  "data-table-row-click": {
    name: "data-table-row-click",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-row-click")
    ),
    file: "specs/examples/data-table-row-click.tsx",
  },
  "data-table-custom-cell": {
    name: "data-table-custom-cell",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-custom-cell")
    ),
    file: "specs/examples/data-table-custom-cell.tsx",
  },
  "data-table-search": {
    name: "data-table-search",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-search")
    ),
    file: "specs/examples/data-table-search.tsx",
  },
  "data-table-pagination": {
    name: "data-table-pagination",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-pagination")
    ),
    file: "specs/examples/data-table-pagination.tsx",
  },
  "data-table-filters": {
    name: "data-table-filters",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-filters")
    ),
    file: "specs/examples/data-table-filters.tsx",
  },
  "data-table-filters-date": {
    name: "data-table-filters-date",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-filters-date")
    ),
    file: "specs/examples/data-table-filters-date.tsx",
  },
  "data-table-filters-initial": {
    name: "data-table-filters-initial",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-filters-initial")
    ),
    file: "specs/examples/data-table-filters-initial.tsx",
  },
  "data-table-sorting": {
    name: "data-table-sorting",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-sorting")
    ),
    file: "specs/examples/data-table-sorting.tsx",
  },
  "data-table-sorting-initial": {
    name: "data-table-sorting-initial",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-sorting-initial")
    ),
    file: "specs/examples/data-table-sorting-initial.tsx",
  },
  "data-table-commands": {
    name: "data-table-commands",
    component: React.lazy(
      async () => import("@/specs/examples/data-table-commands")
    ),
    file: "specs/examples/data-table-commands.tsx",
  },
  "icon-badge-demo": {
    name: "icon-badge-demo",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-demo")
    ),
    file: "specs/examples/icon-badge-demo.tsx",
  },
  "icon-badge-blue": {
    name: "icon-badge-blue",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-blue")
    ),
    file: "specs/examples/icon-badge-blue.tsx",
  },
  "icon-badge-green": {
    name: "icon-badge-green",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-green")
    ),
    file: "specs/examples/icon-badge-green.tsx",
  },
  "icon-badge-red": {
    name: "icon-badge-red",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-red")
    ),
    file: "specs/examples/icon-badge-red.tsx",
  },
  "icon-badge-orange": {
    name: "icon-badge-orange",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-orange")
    ),
    file: "specs/examples/icon-badge-orange.tsx",
  },
  "icon-badge-purple": {
    name: "icon-badge-purple",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-purple")
    ),
    file: "specs/examples/icon-badge-purple.tsx",
  },
  "icon-badge-grey": {
    name: "icon-badge-grey",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-grey")
    ),
    file: "specs/examples/icon-badge-grey.tsx",
  },
  "icon-badge-base": {
    name: "icon-badge-base",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-base")
    ),
    file: "specs/examples/icon-badge-base.tsx",
  },
  "icon-badge-large": {
    name: "icon-badge-large",
    component: React.lazy(
      async () => import("@/specs/examples/icon-badge-large")
    ),
    file: "specs/examples/icon-badge-large.tsx",
  },
  "inline-tip-demo": {
    name: "inline-tip-demo",
    component: React.lazy(
      async () => import("@/specs/examples/inline-tip-demo")
    ),
    file: "specs/examples/inline-tip-demo.tsx",
  },
  "inline-tip-warning": {
    name: "inline-tip-warning",
    component: React.lazy(
      async () => import("@/specs/examples/inline-tip-warning")
    ),
    file: "specs/examples/inline-tip-warning.tsx",
  },
  "inline-tip-error": {
    name: "inline-tip-error",
    component: React.lazy(
      async () => import("@/specs/examples/inline-tip-error")
    ),
    file: "specs/examples/inline-tip-error.tsx",
  },
  "inline-tip-success": {
    name: "inline-tip-success",
    component: React.lazy(
      async () => import("@/specs/examples/inline-tip-success")
    ),
    file: "specs/examples/inline-tip-success.tsx",
  },
  "button-demo": {
    name: "button-demo",
    component: React.lazy(async () => import("@/specs/examples/button-demo")),
    file: "specs/examples/button-demo.tsx",
  },
  "calendar-demo": {
    name: "calendar-demo",
    component: React.lazy(async () => import("@/specs/examples/calendar-demo")),
    file: "specs/examples/calendar-demo.tsx",
  },
  "checkbox-demo": {
    name: "checkbox-demo",
    component: React.lazy(async () => import("@/specs/examples/checkbox-demo")),
    file: "specs/examples/checkbox-demo.tsx",
  },
  "code-block-demo": {
    name: "code-block-demo",
    component: React.lazy(
      async () => import("@/specs/examples/code-block-demo")
    ),
    file: "specs/examples/code-block-demo.tsx",
  },
  "command-demo": {
    name: "command-demo",
    component: React.lazy(async () => import("@/specs/examples/command-demo")),
    file: "specs/examples/command-demo.tsx",
  },
  "container-demo": {
    name: "container-demo",
    component: React.lazy(
      async () => import("@/specs/examples/container-demo")
    ),
    file: "specs/examples/container-demo.tsx",
  },
  "copy-demo": {
    name: "copy-demo",
    component: React.lazy(async () => import("@/specs/examples/copy-demo")),
    file: "specs/examples/copy-demo.tsx",
  },
  "copy-custom-display": {
    name: "copy-custom-display",
    component: React.lazy(
      async () => import("@/specs/examples/copy-custom-display")
    ),
    file: "specs/examples/copy-custom-display.tsx",
  },
  "copy-as-child": {
    name: "copy-as-child",
    component: React.lazy(async () => import("@/specs/examples/copy-as-child")),
    file: "specs/examples/copy-as-child.tsx",
  },
  "date-picker-demo": {
    name: "date-picker-demo",
    component: React.lazy(
      async () => import("@/specs/examples/date-picker-demo")
    ),
    file: "specs/examples/date-picker-demo.tsx",
  },
  "date-picker-controlled": {
    name: "date-picker-controlled",
    component: React.lazy(
      async () => import("@/specs/examples/date-picker-controlled")
    ),
    file: "specs/examples/date-picker-controlled.tsx",
  },
  "date-picker-with-time": {
    name: "date-picker-with-time",
    component: React.lazy(
      async () => import("@/specs/examples/date-picker-with-time")
    ),
    file: "specs/examples/date-picker-with-time.tsx",
  },
  "date-picker-min-max": {
    name: "date-picker-min-max",
    component: React.lazy(
      async () => import("@/specs/examples/date-picker-min-max")
    ),
    file: "specs/examples/date-picker-min-max.tsx",
  },
  "date-picker-business-hours": {
    name: "date-picker-business-hours",
    component: React.lazy(
      async () => import("@/specs/examples/date-picker-business-hours")
    ),
    file: "specs/examples/date-picker-business-hours.tsx",
  },
  "date-picker-granularity": {
    name: "date-picker-granularity",
    component: React.lazy(
      async () => import("@/specs/examples/date-picker-granularity")
    ),
    file: "specs/examples/date-picker-granularity.tsx",
  },
  "date-picker-form": {
    name: "date-picker-form",
    component: React.lazy(
      async () => import("@/specs/examples/date-picker-form")
    ),
    file: "specs/examples/date-picker-form.tsx",
  },
  "drawer-demo": {
    name: "drawer-demo",
    component: React.lazy(async () => import("@/specs/examples/drawer-demo")),
    file: "specs/examples/drawer-demo.tsx",
  },
  "dropdown-menu-demo": {
    name: "dropdown-menu-demo",
    component: React.lazy(
      async () => import("@/specs/examples/dropdown-menu-demo")
    ),
    file: "specs/examples/dropdown-menu-demo.tsx",
  },
  "focus-modal-demo": {
    name: "focus-modal-demo",
    component: React.lazy(
      async () => import("@/specs/examples/focus-modal-demo")
    ),
    file: "specs/examples/focus-modal-demo.tsx",
  },
  "heading-demo": {
    name: "heading-demo",
    component: React.lazy(async () => import("@/specs/examples/heading-demo")),
    file: "specs/examples/heading-demo.tsx",
  },
  "input-demo": {
    name: "input-demo",
    component: React.lazy(async () => import("@/specs/examples/input-demo")),
    file: "specs/examples/input-demo.tsx",
  },
  "input-password": {
    name: "input-password",
    component: React.lazy(
      async () => import("@/specs/examples/input-password")
    ),
    file: "specs/examples/input-password.tsx",
  },
  "input-search": {
    name: "input-search",
    component: React.lazy(async () => import("@/specs/examples/input-search")),
    file: "specs/examples/input-search.tsx",
  },
  "input-disabled": {
    name: "input-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/input-disabled")
    ),
    file: "specs/examples/input-disabled.tsx",
  },
  "input-small": {
    name: "input-small",
    component: React.lazy(async () => import("@/specs/examples/input-small")),
    file: "specs/examples/input-small.tsx",
  },
  "input-error": {
    name: "input-error",
    component: React.lazy(async () => import("@/specs/examples/input-error")),
    file: "specs/examples/input-error.tsx",
  },
  "kbd-demo": {
    name: "kbd-demo",
    component: React.lazy(async () => import("@/specs/examples/kbd-demo")),
    file: "specs/examples/kbd-demo.tsx",
  },
  "label-demo": {
    name: "label-demo",
    component: React.lazy(async () => import("@/specs/examples/label-demo")),
    file: "specs/examples/label-demo.tsx",
  },
  "prompt-demo": {
    name: "prompt-demo",
    component: React.lazy(async () => import("@/specs/examples/prompt-demo")),
    file: "specs/examples/prompt-demo.tsx",
  },
  "radio-group-demo": {
    name: "radio-group-demo",
    component: React.lazy(
      async () => import("@/specs/examples/radio-group-demo")
    ),
    file: "specs/examples/radio-group-demo.tsx",
  },
  "radio-group-descriptions": {
    name: "radio-group-descriptions",
    component: React.lazy(
      async () => import("@/specs/examples/radio-group-descriptions")
    ),
    file: "specs/examples/radio-group-descriptions.tsx",
  },
  "radio-group-disabled": {
    name: "radio-group-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/radio-group-disabled")
    ),
    file: "specs/examples/radio-group-disabled.tsx",
  },
  "select-demo": {
    name: "select-demo",
    component: React.lazy(async () => import("@/specs/examples/select-demo")),
    file: "specs/examples/select-demo.tsx",
  },
  "switch-demo": {
    name: "switch-demo",
    component: React.lazy(async () => import("@/specs/examples/switch-demo")),
    file: "specs/examples/switch-demo.tsx",
  },
  "switch-small": {
    name: "switch-small",
    component: React.lazy(async () => import("@/specs/examples/switch-small")),
    file: "specs/examples/switch-small.tsx",
  },
  "switch-disabled": {
    name: "switch-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/switch-disabled")
    ),
    file: "specs/examples/switch-disabled.tsx",
  },
  "switch-checked": {
    name: "switch-checked",
    component: React.lazy(
      async () => import("@/specs/examples/switch-checked")
    ),
    file: "specs/examples/switch-checked.tsx",
  },
  "switch-checked-disabled": {
    name: "switch-checked-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/switch-checked-disabled")
    ),
    file: "specs/examples/switch-checked-disabled.tsx",
  },
  "table-pagination": {
    name: "table-pagination",
    component: React.lazy(
      async () => import("@/specs/examples/table-pagination")
    ),
    file: "specs/examples/table-pagination.tsx",
  },
  "table-demo": {
    name: "table-demo",
    component: React.lazy(async () => import("@/specs/examples/table-demo")),
    file: "specs/examples/table-demo.tsx",
  },
  "text-demo": {
    name: "text-demo",
    component: React.lazy(async () => import("@/specs/examples/text-demo")),
    file: "specs/examples/text-demo.tsx",
  },
  "text-examples": {
    name: "text-examples",
    component: React.lazy(async () => import("@/specs/examples/text-examples")),
    file: "specs/examples/text-examples.tsx",
  },
  "textarea-demo": {
    name: "textarea-demo",
    component: React.lazy(async () => import("@/specs/examples/textarea-demo")),
    file: "specs/examples/textarea-demo.tsx",
  },
  "toaster-demo": {
    name: "toaster-demo",
    component: React.lazy(async () => import("@/specs/examples/toaster-demo")),
    file: "specs/examples/toaster-demo.tsx",
  },
  "toaster-dismiss": {
    name: "toaster-dismiss",
    component: React.lazy(
      async () => import("@/specs/examples/toaster-dismiss")
    ),
    file: "specs/examples/toaster-dismiss.tsx",
  },
  "toaster-warning": {
    name: "toaster-warning",
    component: React.lazy(
      async () => import("@/specs/examples/toaster-warning")
    ),
    file: "specs/examples/toaster-warning.tsx",
  },
  "toaster-error": {
    name: "toaster-error",
    component: React.lazy(async () => import("@/specs/examples/toaster-error")),
    file: "specs/examples/toaster-error.tsx",
  },
  "toaster-success": {
    name: "toaster-success",
    component: React.lazy(
      async () => import("@/specs/examples/toaster-success")
    ),
    file: "specs/examples/toaster-success.tsx",
  },
  "toaster-loading": {
    name: "toaster-loading",
    component: React.lazy(
      async () => import("@/specs/examples/toaster-loading")
    ),
    file: "specs/examples/toaster-loading.tsx",
  },
  "toaster-with-action": {
    name: "toaster-with-action",
    component: React.lazy(
      async () => import("@/specs/examples/toaster-with-action")
    ),
    file: "specs/examples/toaster-with-action.tsx",
  },
  "tooltip-demo": {
    name: "tooltip-demo",
    component: React.lazy(async () => import("@/specs/examples/tooltip-demo")),
    file: "specs/examples/tooltip-demo.tsx",
  },
  "button-primary": {
    name: "button-primary",
    component: React.lazy(
      async () => import("@/specs/examples/button-primary")
    ),
    file: "specs/examples/button-primary.tsx",
  },
  "button-secondary": {
    name: "button-secondary",
    component: React.lazy(
      async () => import("@/specs/examples/button-secondary")
    ),
    file: "specs/examples/button-secondary.tsx",
  },
  "button-transparent": {
    name: "button-transparent",
    component: React.lazy(
      async () => import("@/specs/examples/button-transparent")
    ),
    file: "specs/examples/button-transparent.tsx",
  },
  "button-danger": {
    name: "button-danger",
    component: React.lazy(async () => import("@/specs/examples/button-danger")),
    file: "specs/examples/button-danger.tsx",
  },
  "button-disabled": {
    name: "button-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/button-disabled")
    ),
    file: "specs/examples/button-disabled.tsx",
  },
  "button-with-icon": {
    name: "button-with-icon",
    component: React.lazy(
      async () => import("@/specs/examples/button-with-icon")
    ),
    file: "specs/examples/button-with-icon.tsx",
  },
  "icon-button-demo": {
    name: "icon-button-demo",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-demo")
    ),
    file: "specs/examples/icon-button-demo.tsx",
  },
  "icon-button-primary": {
    name: "icon-button-primary",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-primary")
    ),
    file: "specs/examples/icon-button-primary.tsx",
  },
  "icon-button-transparent": {
    name: "icon-button-transparent",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-transparent")
    ),
    file: "specs/examples/icon-button-transparent.tsx",
  },
  "icon-button-disabled": {
    name: "icon-button-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-disabled")
    ),
    file: "specs/examples/icon-button-disabled.tsx",
  },
  "icon-button-loading": {
    name: "icon-button-with-text",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-loading")
    ),
    file: "specs/examples/icon-button-loading.tsx",
  },
  "icon-button-base": {
    name: "icon-button-base",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-base")
    ),
    file: "specs/examples/icon-button-base.tsx",
  },
  "icon-button-large": {
    name: "icon-button-large",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-large")
    ),
    file: "specs/examples/icon-button-large.tsx",
  },
  "icon-button-xlarge": {
    name: "icon-button-xlarge",
    component: React.lazy(
      async () => import("@/specs/examples/icon-button-xlarge")
    ),
    file: "specs/examples/icon-button-xlarge.tsx",
  },
  "icon-color-classes": {
    name: "icon-color-classes",
    component: React.lazy(
      async () => import("@/specs/examples/icon-color-classes")
    ),
    file: "specs/examples/icon-color-classes.tsx",
  },
  "icon-color": {
    name: "icon-color",
    component: React.lazy(async () => import("@/specs/examples/icon-color")),
    file: "specs/examples/icon-color.tsx",
  },
  "currency-input-demo": {
    name: "currency-input-demo",
    component: React.lazy(
      async () => import("@/specs/examples/currency-input-demo")
    ),
    file: "specs/examples/currency-input-demo.tsx",
  },
  "currency-input-small": {
    name: "currency-input-small",
    component: React.lazy(
      async () => import("@/specs/examples/currency-input-small")
    ),
    file: "specs/examples/currency-input-small.tsx",
  },
  "status-badge-demo": {
    name: "status-badge-demo",
    component: React.lazy(
      async () => import("@/specs/examples/status-badge-demo")
    ),
    file: "specs/examples/status-badge-demo.tsx",
  },
  "status-badge-blue": {
    name: "status-badge-blue",
    component: React.lazy(
      async () => import("@/specs/examples/status-badge-blue")
    ),
    file: "specs/examples/status-badge-blue.tsx",
  },
  "status-badge-green": {
    name: "status-badge-green",
    component: React.lazy(
      async () => import("@/specs/examples/status-badge-green")
    ),
    file: "specs/examples/status-badge-green.tsx",
  },
  "status-badge-red": {
    name: "status-badge-red",
    component: React.lazy(
      async () => import("@/specs/examples/status-badge-red")
    ),
    file: "specs/examples/status-badge-red.tsx",
  },
  "status-badge-orange": {
    name: "status-badge-orange",
    component: React.lazy(
      async () => import("@/specs/examples/status-badge-orange")
    ),
    file: "specs/examples/status-badge-orange.tsx",
  },
  "status-badge-purple": {
    name: "status-badge-purple",
    component: React.lazy(
      async () => import("@/specs/examples/status-badge-purple")
    ),
    file: "specs/examples/status-badge-purple.tsx",
  },
  "status-badge-grey": {
    name: "status-badge-grey",
    component: React.lazy(
      async () => import("@/specs/examples/status-badge-grey")
    ),
    file: "specs/examples/status-badge-grey.tsx",
  },
  "command-bar-demo": {
    name: "command-bar-demo",
    component: React.lazy(
      async () => import("@/specs/examples/command-bar-demo")
    ),
    file: "specs/examples/command-bar-demo.tsx",
  },
  "progress-accordion-demo": {
    name: "progress-accordion-demo",
    component: React.lazy(
      async () => import("@/specs/examples/progress-accordion-demo")
    ),
    file: "specs/examples/progress-accordion-demo.tsx",
  },
  "progress-accordion-single": {
    name: "progress-accordion-single",
    component: React.lazy(
      async () => import("@/specs/examples/progress-accordion-single")
    ),
    file: "specs/examples/progress-accordion-single.tsx",
  },
  "progress-accordion-multiple": {
    name: "progress-accordion-multiple",
    component: React.lazy(
      async () => import("@/specs/examples/progress-accordion-multiple")
    ),
    file: "specs/examples/progress-accordion-multiple.tsx",
  },
  "progress-tabs-demo": {
    name: "progress-tabs-demo",
    component: React.lazy(
      async () => import("@/specs/examples/progress-tabs-demo")
    ),
    file: "specs/examples/progress-tabs-demo.tsx",
  },
  "tabs-demo": {
    name: "tabs-demo",
    component: React.lazy(async () => import("@/specs/examples/tabs-demo")),
    file: "specs/examples/tabs-demo.tsx",
  },
  "currency-input-base": {
    name: "currency-input-base",
    component: React.lazy(
      async () => import("@/specs/examples/currency-input-base")
    ),
    file: "specs/examples/currency-input-base.tsx",
  },
  "button-loading": {
    name: "button-loading",
    component: React.lazy(
      async () => import("@/specs/examples/button-loading")
    ),
    file: "specs/examples/button-loading.tsx",
  },
  "select-item-aligned": {
    name: "select-item-aligned",
    component: React.lazy(
      async () => import("@/specs/examples/select-item-aligned")
    ),
    file: "specs/examples/select-item-aligned.tsx",
  },
  "select-small": {
    name: "select-small",
    component: React.lazy(async () => import("@/specs/examples/select-small")),
    file: "specs/examples/select-small.tsx",
  },
  "select-disabled": {
    name: "select-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/select-disabled")
    ),
    file: "specs/examples/select-disabled.tsx",
  },
  "select-grouped-items": {
    name: "select-grouped-items",
    component: React.lazy(
      async () => import("@/specs/examples/select-grouped-items")
    ),
    file: "specs/examples/select-grouped-items.tsx",
  },
  "select-controlled": {
    name: "select-controlled",
    component: React.lazy(
      async () => import("@/specs/examples/select-controlled")
    ),
    file: "specs/examples/select-controlled.tsx",
  },
  "label-base-regular": {
    name: "label-base-regular",
    component: React.lazy(
      async () => import("@/specs/examples/label-base-regular")
    ),
    file: "specs/examples/label-base-regular.tsx",
  },
  "label-base-plus": {
    name: "label-base-plus",
    component: React.lazy(
      async () => import("@/specs/examples/label-base-plus")
    ),
    file: "specs/examples/label-base-plus.tsx",
  },
  "label-large-regular": {
    name: "label-large-regular",
    component: React.lazy(
      async () => import("@/specs/examples/label-large-regular")
    ),
    file: "specs/examples/label-large-regular.tsx",
  },
  "label-large-plus": {
    name: "label-large-plus",
    component: React.lazy(
      async () => import("@/specs/examples/label-large-plus")
    ),
    file: "specs/examples/label-large-plus.tsx",
  },
  "label-small-regular": {
    name: "label-small-regular",
    component: React.lazy(
      async () => import("@/specs/examples/label-small-regular")
    ),
    file: "specs/examples/label-small-regular.tsx",
  },
  "label-small-plus": {
    name: "label-small-plus",
    component: React.lazy(
      async () => import("@/specs/examples/label-small-plus")
    ),
    file: "specs/examples/label-small-plus.tsx",
  },
  "label-xsmall-regular": {
    name: "label-xsmall-regular",
    component: React.lazy(
      async () => import("@/specs/examples/label-xsmall-regular")
    ),
    file: "specs/examples/label-xsmall-regular.tsx",
  },
  "label-xsmall-plus": {
    name: "label-xsmall-regular",
    component: React.lazy(
      async () => import("@/specs/examples/label-xsmall-plus")
    ),
    file: "specs/examples/label-xsmall-plus.tsx",
  },
  "checkbox-default": {
    name: "checkbox-default",
    component: React.lazy(
      async () => import("@/specs/examples/checkbox-default")
    ),
    file: "specs/examples/checkbox-default.tsx",
  },
  "checkbox-checked": {
    name: "checkbox-checked",
    component: React.lazy(
      async () => import("@/specs/examples/checkbox-checked")
    ),
    file: "specs/examples/checkbox-checked.tsx",
  },
  "checkbox-disabled": {
    name: "checkbox-disabled",
    component: React.lazy(
      async () => import("@/specs/examples/checkbox-disabled")
    ),
    file: "specs/examples/checkbox-disabled.tsx",
  },
  "checkbox-indeterminate": {
    name: "checkbox-indeterminate",
    component: React.lazy(
      async () => import("@/specs/examples/checkbox-indeterminate")
    ),
    file: "specs/examples/checkbox-indeterminate.tsx",
  },
  "code-block-single": {
    name: "code-block-single",
    component: React.lazy(
      async () => import("@/specs/examples/code-block-single")
    ),
    file: "specs/examples/code-block-single.tsx",
  },
  "code-block-no-lines": {
    name: "code-block-no-lines",
    component: React.lazy(
      async () => import("@/specs/examples/code-block-no-lines")
    ),
    file: "specs/examples/code-block-no-lines.tsx",
  },
  "code-block-no-header": {
    name: "code-block-no-header",
    component: React.lazy(
      async () => import("@/specs/examples/code-block-no-header")
    ),
    file: "specs/examples/code-block-no-header.tsx",
  },
  "code-block-no-copy": {
    name: "code-block-no-copy",
    component: React.lazy(
      async () => import("@/specs/examples/code-block-no-copy")
    ),
    file: "specs/examples/code-block-no-copy.tsx",
  },
  "container-layout": {
    name: "container-layout",
    component: React.lazy(
      async () => import("@/specs/examples/container-layout")
    ),
    file: "specs/examples/container-layout.tsx",
  },
  "dropdown-menu-sorting": {
    name: "dropdown-menu-sorting",
    component: React.lazy(
      async () => import("@/specs/examples/dropdown-menu-sorting")
    ),
    file: "specs/examples/dropdown-menu-sorting.tsx",
  },
  "use-prompt-demo": {
    name: "use-prompt-demo",
    component: React.lazy(
      async () => import("@/specs/examples/use-prompt-demo")
    ),
    file: "specs/examples/use-prompt-demo.tsx",
  },
  "use-prompt-verification": {
    name: "use-prompt-demo",
    component: React.lazy(
      async () => import("@/specs/examples/use-prompt-verification")
    ),
    file: "specs/examples/use-prompt-verification.tsx",
  },
  "use-toggle-state-demo": {
    name: "use-toggle-state",
    component: React.lazy(
      async () => import("@/specs/examples/use-toggle-state-demo")
    ),
    file: "specs/examples/use-toggle-state-demo.tsx",
  },
}
