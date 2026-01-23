import { clsx } from "clsx"
import React from "react"

type ShadedBlockProps = {
  className?: string
  variant?: "default" | "subtle"
}

export const ShadedBlock = ({
  className,
  variant = "default",
}: ShadedBlockProps) => {
  return (
    <div
      className={clsx(
        "bg-repeat",
        "h-full w-auto",
        variant === "default" && "bg-bg-stripes dark:bg-bg-stripes-dark",
        variant === "subtle" &&
          "bg-bg-stripes-subtle dark:bg-bg-stripes-subtle-dark",
        className
      )}
    />
  )
}
