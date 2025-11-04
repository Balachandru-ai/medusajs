"use client"

import {
  AnalyticsProvider,
  ColorModeProvider,
  MobileProvider,
  ModalProvider,
  PageLoadingProvider,
  ScrollControllerProvider,
} from "docs-ui"
import BaseSpecsProvider from "./base-specs"
import SidebarProvider from "./sidebar"
import SearchProvider from "./search"

type ProvidersProps = {
  children?: React.ReactNode
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <AnalyticsProvider
      posthogApiKey={process.env.NEXT_PUBLIC_POSTHOG_API_KEY}
      posthogHost={process.env.NEXT_PUBLIC_POSTHOG_HOST}
    >
      <PageLoadingProvider>
        <ModalProvider>
          <ColorModeProvider>
            <BaseSpecsProvider>
              <ScrollControllerProvider scrollableSelector="#main">
                <SidebarProvider>
                  <SearchProvider>
                    <MobileProvider>{children}</MobileProvider>
                  </SearchProvider>
                </SidebarProvider>
              </ScrollControllerProvider>
            </BaseSpecsProvider>
          </ColorModeProvider>
        </ModalProvider>
      </PageLoadingProvider>
    </AnalyticsProvider>
  )
}

export default Providers
