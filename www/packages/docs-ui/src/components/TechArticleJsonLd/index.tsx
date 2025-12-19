"use client"

import React, { useEffect, useState } from "react"
import type { TechArticle } from "schema-dts"
import { useIsBrowser, useSiteConfig } from "../../providers"
import { getJsonLd } from "../../utils"
import { usePathname } from "next/navigation"

export const TechArticleJsonLd = () => {
  const {
    config: { baseUrl, basePath, description: configDescription, titleSuffix },
    frontmatter,
  } = useSiteConfig()
  const pathname = usePathname()
  const { isBrowser } = useIsBrowser()
  const [jsonLdData, setJsonLdData] = useState("{}")

  useEffect(() => {
    if (!isBrowser) {
      return
    }

    // Use a small delay to ensure the document has been updated after navigation
    const updateJsonLd = () => {
      const baseLink = `${baseUrl}${basePath}`.replace(/\/+$/, "")
      const title = document.title.replace(` - ${titleSuffix}`, "")
      const description =
        document.querySelector("#main p")?.textContent ||
        configDescription ||
        ""

      const data = getJsonLd<TechArticle>({
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: title,
        description,
        proficiencyLevel: "Expert",
        author: "Medusa",
        genre: "Documentation",
        keywords:
          frontmatter.keywords?.join(", ") || "medusa, ecommerce, open-source",
        url: `${baseLink}${pathname}`,
      })

      setJsonLdData(data)
    }

    // Update immediately
    updateJsonLd()

    // Also set up a MutationObserver to watch for title changes
    const titleObserver = new MutationObserver(() => {
      updateJsonLd()
    })

    const titleElement = document.querySelector("title")
    if (titleElement) {
      titleObserver.observe(titleElement, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    }

    return () => {
      titleObserver.disconnect()
    }
  }, [isBrowser, pathname, baseUrl, basePath, configDescription, titleSuffix])

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdData }}
    />
  )
}
