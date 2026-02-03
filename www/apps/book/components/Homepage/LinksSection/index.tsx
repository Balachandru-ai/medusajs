import clsx from "clsx"
import { HeadlineTags, ShadedBlock } from "docs-ui"
import Link from "next/link"

const HomepageLinksSection = () => {
  const links: {
    tag: string
    links: {
      text: string
      link: string
    }[]
  }[] = [
    {
      tag: "Customize Medusa Application",
      links: [
        {
          link: "/learn/installation",
          text: "Install Medusa",
        },
        {
          link: "https://docs.medusajs.com/cloud/sign-up",
          text: "Deploy to Cloud",
        },
        {
          link: "https://docs.medusajs.com/resources/integrations",
          text: "Browse integrations",
        },
      ],
    },
    {
      tag: "Admin Development",
      links: [
        {
          link: "/learn/fundamentals/admin/widgets",
          text: "Build a UI widget",
        },
        {
          link: "/learn/fundamentals/admin/ui-routes",
          text: "Add a UI route",
        },
        {
          link: "https://docs.medusajs.com/ui",
          text: "Browse the UI library",
        },
      ],
    },
    {
      tag: "Storefront Development",
      links: [
        {
          link: "https://docs.medusajs.com/resources/nextjs-starter",
          text: "Explore storefront starter",
        },
        {
          link: "https://docs.medusajs.com/resources/storefront-development",
          text: "Build custom storefront",
        },
        {
          link: "https://docs.medusajs.com/learn/introduction/build-with-llms-ai#ecommerce-storefront-best-practices",
          text: "Use agent skills",
        },
      ],
    },
  ]

  return (
    <div className="w-full flex gap-0 flex-col md:flex-row md:min-h-[320px] border-b border-medusa-border-base">
      {links.map((section, index) => (
        <div
          key={index}
          className={clsx(
            "p-2 flex justify-between flex-col w-full md:w-1/3 gap-2",
            "border-b border-medusa-border-base md:border-b-0",
            index !== links.length - 1 && "md:border-r"
          )}
        >
          <HeadlineTags tags={[section.tag]} className="!justify-start" />
          <div className="flex flex-col gap-0.75">
            {section.links.map((link, linkIndex) => (
              <div className="flex gap-0.75" key={linkIndex}>
                <ShadedBlock className="!w-2 min-h-2" />
                <Link
                  href={link.link}
                  className={clsx(
                    "flex-1 text-medusa-fg-base text-h2 hover:underline hover:text-medusa-fg-interactive"
                  )}
                >
                  {link.text}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default HomepageLinksSection
