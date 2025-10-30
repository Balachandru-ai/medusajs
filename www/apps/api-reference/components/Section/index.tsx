"use client"

import clsx from "clsx"
import { useActiveOnScroll, useSidebar } from "docs-ui"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export type SectionProps = {
  checkActiveOnScroll?: boolean
} & React.AllHTMLAttributes<HTMLDivElement>

const Section = ({
  children,
  className,
  checkActiveOnScroll = false,
}: SectionProps) => {
  const [sectionElm, setSectionElm] = useState<HTMLDivElement | null>(null)
  const { activeItemId } = useActiveOnScroll({
    rootElm: sectionElm || undefined,
    enable: checkActiveOnScroll,
    useDefaultIfNoActive: false,
    maxLevel: 2,
  })
  const { setActivePath } = useSidebar()
  const router = useRouter()

  useEffect(() => {
    if ("scrollRestoration" in history) {
      // disable scroll on refresh
      history.scrollRestoration = "manual"
    }
  }, [])

  useEffect(() => {
    if (activeItemId.length) {
      router.push(`#${activeItemId}`, {
        scroll: false,
      })
      setActivePath(activeItemId)
    }
  }, [activeItemId])

  return (
    <div
      ref={(ref) => setSectionElm(ref)}
      className={clsx("[&_ul]:list-disc [&_ul]:px-1", "[&_h2]:pt-7", className)}
    >
      {children}
    </div>
  )
}

export default Section
