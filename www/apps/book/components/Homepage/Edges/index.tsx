import clsx from "clsx"

type HomepageEdgesProps = {
  className?: string
}

const HomepageEdges = ({ className }: HomepageEdgesProps) => {
  return (
    <>
      <span
        className={clsx(
          "absolute top-0 left-0 w-[5px] h-[5px] border-t border-l border-medusa-fg-subtle",
          className
        )}
      />
      <span
        className={clsx(
          "absolute top-0 right-0 w-[5px] h-[5px] border-t border-r border-medusa-fg-subtle",
          className
        )}
      />
      <span
        className={clsx(
          "absolute bottom-0 left-0 w-[5px] h-[5px] border-b border-l border-medusa-fg-subtle",
          className
        )}
      />
      <span
        className={clsx(
          "absolute bottom-0 right-0 w-[5px] h-[5px] border-b border-r border-medusa-fg-subtle",
          className
        )}
      />
    </>
  )
}

export default HomepageEdges
