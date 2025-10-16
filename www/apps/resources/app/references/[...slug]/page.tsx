import { cache, Suspense } from "react"
import { Loading } from "docs-ui"
import path from "path"
import fs from "fs/promises"
import mdxOptions from "@/mdx-options.mjs"
import {
  typeListLinkFixerPlugin,
  localLinksRehypePlugin,
  workflowDiagramLinkFixerPlugin,
  prerequisitesLinkFixerPlugin,
  recmaInjectMdxDataPlugin,
} from "remark-rehype-plugins"
import { MDXRemote } from "next-mdx-remote-client/rsc"
import MDXComponents from "../../../components/MDXComponents"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getFrontMatterFromString } from "docs-utils"

type PageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export default async function ReferencesPage(props: PageProps) {
  const params = await props.params
  const { slug } = params

  const fileData = await loadReferencesFile(slug)
  if (!fileData) {
    return notFound()
  }

  const pluginOptions = {
    filePath: fileData.path,
    basePath: process.cwd(),
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="animate animate-fadeIn">
        <MDXRemote
          source={fileData.content}
          components={MDXComponents}
          options={{
            disableImports: true,
            mdxOptions: {
              development: process.env.NEXT_PUBLIC_ENV === "development",
              format: "mdx",
              rehypePlugins: [
                ...mdxOptions.options.rehypePlugins,
                [
                  typeListLinkFixerPlugin,
                  {
                    ...pluginOptions,
                    checkLinksType: "md",
                  },
                ],
                [
                  workflowDiagramLinkFixerPlugin,
                  {
                    ...pluginOptions,
                    checkLinksType: "value",
                  },
                ],
                [
                  prerequisitesLinkFixerPlugin,
                  {
                    ...pluginOptions,
                    checkLinksType: "value",
                  },
                ],
                [localLinksRehypePlugin, pluginOptions],
              ],
              remarkPlugins: [...mdxOptions.options.remarkPlugins],
              recmaPlugins: [
                [
                  recmaInjectMdxDataPlugin,
                  { isRemoteMdx: true, mode: process.env.NODE_ENV },
                ],
              ],
            },
          }}
        />
      </div>
    </Suspense>
  )
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // read route params
  const slug = (await params).slug
  const metadata: Metadata = {}

  const fileData = await loadReferencesFile(slug)

  if (!fileData) {
    return metadata
  }

  const pageTitleMatch = /#(?<title>[\w -]+)/.exec(fileData.content)

  if (!pageTitleMatch?.groups?.title) {
    return metadata
  }

  metadata.title = pageTitleMatch.groups.title
  const frontmatter = await getFrontMatterFromString(fileData.content)
  metadata.keywords = (frontmatter.keywords || []) as string[]

  return metadata
}

export type LoadedReferenceFile = {
  content: string
  // source: MDXRemoteSerializeResult
  path: string
}

const loadReferencesFile = cache(
  async (slug: string[]): Promise<LoadedReferenceFile | undefined> => {
    path.join(process.cwd(), "references")
    const monoRepoPath = path.resolve("..", "..", "..")

    const pathname = `/references/${slug.join("/")}`
    const slugChanges = (await import("@/generated/slug-changes.mjs"))
      .slugChanges
    const filesMap = (await import("@/generated/files-map.mjs")).filesMap
    const fileDetails =
      slugChanges.find((f) => f.newSlug === pathname) ||
      filesMap.find((f) => f.pathname === pathname)
    if (!fileDetails) {
      return undefined
    }
    const fullPath = path.join(monoRepoPath, fileDetails.filePath)

    const fileContent = await fs.readFile(fullPath, "utf-8")
    return {
      content: fileContent,
      path: fullPath,
    }
  }
)
