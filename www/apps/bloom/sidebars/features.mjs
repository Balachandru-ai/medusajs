/** @type {import('types').Sidebar.RawSidebar} */
export const featuresSidebar = [
  {
    sidebar_id: "features",
    title: "Features",
    items: [
      {
        type: "link",
        title: "Commerce Features",
        path: "/commerce-features",
      },
      {
        type: "category",
        title: "Agent Features",
        children: [
          {
            type: "link",
            title: "Mode Switcher",
            path: "/mode-switcher",
          },
          {
            type: "link",
            title: "Selection Mode",
            path: "/selection-mode",
          },
          {
            type: "link",
            title: "Design from Media",
            path: "/design-from-media",
          },
          {
            type: "link",
            title: "Pull from URLs",
            path: "/pull-from-urls",
          },
          {
            type: "link",
            title: "Restore Changes",
            path: "/restore-changes",
          },
        ],
      },
    ],
  },
]
