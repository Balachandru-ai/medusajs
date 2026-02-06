"use client"

import { BloomIcon, MainNavProvider as UiMainNavProvider } from "docs-ui"
import { config } from "../config"
import { MenuItem, NavigationItem, NavigationItemDropdown } from "types"

type MainNavProviderProps = {
  children?: React.ReactNode
}

export const MainNavProvider = ({ children }: MainNavProviderProps) => {
  const navigationItems: NavigationItem[] = [
    {
      type: "link",
      title: "Getting Started",
      link: "/",
    },
    {
      type: "link",
      title: "Features",
      link: `/features`,
    },
    {
      type: "link",
      title: "Prompting",
      link: `/prompting`,
    },
    {
      type: "link",
      title: "Developer Resources",
      link: `/developer-resources`,
    },
    {
      type: "link",
      title: "Changelog",
      link: `/changelog`,
    },
  ]

  const helpNavItem: NavigationItemDropdown = {
    type: "dropdown",
    title: "Help",
    children: [
      // TODO: Update links when resources are available
      {
        type: "link",
        title: "Troubleshooting",
        link: "#",
      },
      {
        type: "link",
        title: "Contact Support",
        link: "#",
      },
    ],
  }

  const additionalMenuItems: MenuItem[] = [
    {
      type: "link",
      title: "Homepage",
      link: "https://bloom.medusajs.com",
    },
  ]

  return (
    <UiMainNavProvider
      navItems={navigationItems}
      logo={<BloomIcon className="text-medusa-fg-subtle" />}
      helpNavItem={helpNavItem}
      additionalMenuItems={additionalMenuItems}
      logoUrl={`${config.baseUrl}${config.basePath}`}
    >
      {children}
    </UiMainNavProvider>
  )
}
