import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { useProductOption } from "../../../hooks/api"
import { productOptionLoader } from "./loader.ts"
import { ProductOptionGeneralSection } from "./components/product-option-general-section"
import { ProductOptionProductSection } from "./components/product-option-product-section"
import { ProductOptionValuesSection } from "./components/product-option-values-section"

export const ProductOptionDetail = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productOptionLoader>
  >

  const { getWidgets } = useExtension()

  const { product_option, isLoading, isError, error } = useProductOption(
    id!,
    undefined,
    {
      initialData,
    }
  )

  if (isLoading || !product_option) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("product_option.details.after"),
        before: getWidgets("product_option.details.before"),
        sideAfter: getWidgets("product_option.details.side.after"),
        sideBefore: getWidgets("product_option.details.side.before"),
      }}
      showJSON
      showMetadata
      data={product_option}
    >
      <TwoColumnPage.Main>
        <ProductOptionGeneralSection productOption={product_option} />
        <ProductOptionProductSection productOption={product_option} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ProductOptionValuesSection productOption={product_option} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
