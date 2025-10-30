"use client"

import { H2 as UiH2 } from "docs-ui"
import { getSectionId } from "docs-utils"
import { useMemo, useRef } from "react"

type H2Props = React.HTMLAttributes<HTMLHeadingElement>

const H2 = ({ children, ...props }: H2Props) => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  const id = useMemo(() => getSectionId([children as string]), [children])

  return (
    <UiH2 {...props} id={id} passRef={headingRef}>
      {children}
    </UiH2>
  )
}

export default H2
