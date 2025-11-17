import * as React from "react"
import type { IconProps } from "../types"
const Plug = React.forwardRef<SVGSVGElement, IconProps>(
  ({ color = "currentColor", ...props }, ref) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={15}
        height={15}
        fill="none"
        ref={ref}
        {...props}
      >
        <path
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5.056 3.722V1.056M9.944 3.722V1.056M2.833 3.722h9.334a.89.89 0 0 1 .889.89v1.555A5.56 5.56 0 0 1 7.5 11.722a5.56 5.56 0 0 1-5.556-5.555V4.61a.89.89 0 0 1 .89-.889M7.5 13.944v-2.222"
        />
      </svg>
    )
  }
)
Plug.displayName = "Plug"
export default Plug
