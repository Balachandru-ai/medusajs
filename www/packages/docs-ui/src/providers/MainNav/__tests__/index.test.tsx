import React from "react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { cleanup, render } from "@testing-library/react"
import { MainNavProvider, useMainNav } from "../index"
import type { NavigationItem, MenuItem } from "types"

// mock data
const defaultUseSiteConfigReturn = {
  config: {
    baseUrl: "",
    basePath: "",
    project: {
      key: "test-project",
      title: "Test Project",
    },
  },
}

// mock hooks
const mockPathname = "/test-path"
const mockUsePathname = vi.fn(() => mockPathname)

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

const mockUseSiteConfig = vi.fn(() => defaultUseSiteConfigReturn)

vi.mock("@/providers/SiteConfig", () => ({
  useSiteConfig: () => mockUseSiteConfig(),
}))

const TestComponent = () => {
  const {
    navItems,
    activeItemIndex,
    activeItem,
    logo,
    logoUrl,
    helpNavItem,
    additionalMenuItems,
  } = useMainNav()
  return (
    <div>
      <div data-testid="nav-items-count">{navItems.length}</div>
      <div data-testid="active-index">
        {activeItemIndex !== undefined ? activeItemIndex : "none"}
      </div>
      <div data-testid="active-item">{activeItem?.title || "none"}</div>
      <div data-testid="logo">{logo ? "custom" : "none"}</div>
      <div data-testid="logo-url">{logoUrl || "none"}</div>
      <div data-testid="help-nav-item">
        {helpNavItem ? helpNavItem.title : "none"}
      </div>
      <div data-testid="additional-menu-items">
        {additionalMenuItems?.length || 0}
      </div>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUsePathname.mockReturnValue("/test-path")
  mockUseSiteConfig.mockReturnValue(defaultUseSiteConfigReturn)
})

afterEach(() => {
  cleanup()
})

describe("rendering", () => {
  test("renders children", () => {
    const navItems: NavigationItem[] = []
    const { container } = render(
      <MainNavProvider navItems={navItems}>
        <div>Test</div>
      </MainNavProvider>
    )
    expect(container).toHaveTextContent("Test")
  })
})

describe("useMainNav hook", () => {
  test("provides navItems", () => {
    const navItems: NavigationItem[] = [
      {
        type: "link",
        title: "Home",
        link: "/home",
      },
    ]

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems}>
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("nav-items-count")).toHaveTextContent("1")
  })

  test("finds active item index for matching link", () => {
    const navItems: NavigationItem[] = [
      {
        type: "link",
        title: "Home",
        link: "/home",
      },
      {
        type: "link",
        title: "Test",
        link: "/test-path",
      },
    ]

    mockUsePathname.mockReturnValue("/test-path")

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems}>
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("active-index")).toHaveTextContent("1")
    expect(getByTestId("active-item")).toHaveTextContent("Test")
  })

  test("finds active item in dropdown", () => {
    const navItems: NavigationItem[] = [
      {
        type: "dropdown",
        title: "Docs",
        link: "/docs",
        children: [
          {
            type: "link",
            title: "Getting Started",
            link: "/docs/getting-started",
          },
          {
            type: "link",
            title: "API",
            link: "/docs/api",
          },
        ],
      },
    ]

    mockUsePathname.mockReturnValue("/docs/api")

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems}>
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("active-index")).toHaveTextContent("0")
  })

  test("uses fallback index when useAsFallback is true", () => {
    const navItems: NavigationItem[] = [
      {
        type: "link",
        title: "Fallback",
        link: "/fallback",
        useAsFallback: true,
      },
      {
        type: "link",
        title: "Other",
        link: "/other",
      },
    ]

    mockUsePathname.mockReturnValue("/fallback/nonexistent")

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems}>
        <TestComponent />
      </MainNavProvider>
    )

    // Should use fallback index when no exact match
    expect(getByTestId("active-index")).toHaveTextContent("0")
  })

  test("filters items by project key", () => {
    const navItems: NavigationItem[] = [
      {
        type: "link",
        title: "Project A",
        link: "/project-a",
        project: "project-a",
      },
      {
        type: "link",
        title: "Test Project",
        link: "/test",
        project: "test-project",
      },
    ]

    mockUsePathname.mockReturnValue("/test")

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems}>
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("active-index")).toHaveTextContent("1")
  })

  test("throws error when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow("useMainNav must be used within a MainNavProvider")

    consoleSpy.mockRestore()
  })

  test("provides custom logo when passed", () => {
    const navItems: NavigationItem[] = []
    const customLogo = <div>Custom Logo</div>

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems} logo={customLogo}>
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("logo")).toHaveTextContent("custom")
  })

  test("provides logoUrl when passed", () => {
    const navItems: NavigationItem[] = []

    const { getByTestId } = render(
      <MainNavProvider
        navItems={navItems}
        logoUrl="https://custom-logo-url.com"
      >
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("logo-url")).toHaveTextContent(
      "https://custom-logo-url.com"
    )
  })

  test("provides helpNavItem when passed", () => {
    const navItems: NavigationItem[] = []
    const customHelpNavItem = {
      type: "dropdown" as const,
      title: "Custom Help",
      children: [
        {
          type: "link" as const,
          title: "Support",
          link: "/support",
        },
      ],
    }

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems} helpNavItem={customHelpNavItem}>
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("help-nav-item")).toHaveTextContent("Custom Help")
  })

  test("provides additionalMenuItems when passed", () => {
    const navItems: NavigationItem[] = []
    const additionalMenuItems: MenuItem[] = [
      {
        type: "link",
        title: "Custom Link 1",
        link: "/custom1",
      },
      {
        type: "link",
        title: "Custom Link 2",
        link: "/custom2",
      },
    ]

    const { getByTestId } = render(
      <MainNavProvider
        navItems={navItems}
        additionalMenuItems={additionalMenuItems}
      >
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("additional-menu-items")).toHaveTextContent("2")
  })

  test("provides default values when optional props not passed", () => {
    const navItems: NavigationItem[] = []

    const { getByTestId } = render(
      <MainNavProvider navItems={navItems}>
        <TestComponent />
      </MainNavProvider>
    )

    expect(getByTestId("logo")).toHaveTextContent("none")
    expect(getByTestId("logo-url")).toHaveTextContent("none")
    expect(getByTestId("help-nav-item")).toHaveTextContent("none")
    expect(getByTestId("additional-menu-items")).toHaveTextContent("0")
  })
})
