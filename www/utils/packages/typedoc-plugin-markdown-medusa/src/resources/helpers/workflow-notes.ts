import Handlebars from "handlebars"
import { SignatureReflection } from "typedoc"
import { MarkdownTheme } from "../../theme.js"
import { getPageFrontmatter } from "../../utils/frontmatter.js"

export default function (theme: MarkdownTheme) {
  Handlebars.registerHelper(
    "workflowNotes",
    function (this: SignatureReflection): string {
      const notes: string[] = []
      const frontmatter = getPageFrontmatter({
        frontmatterData:
          theme.getFormattingOptionsForLocation().frontmatterData,
        reflection: this,
      })
      const hasLocking =
        frontmatter?.tags?.some((tag) => {
          return typeof tag === "string"
            ? tag === "locking"
            : tag.name === "locking"
        }) ?? false

      if (hasLocking) {
        notes.push(
          `:::note

If you use this workflow in another, you must acquire a lock before running it and release the lock after. Learn more in the [Locking Operations in Workflows](https://docs.medusajs.com/learn/fundamentals/workflows/locks#locks-in-nested-workflows) guide.

:::`
        )
      }

      return notes.join("\n\n")
    }
  )
}
