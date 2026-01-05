import {
  useDeleteProductTagAction
} from "./chunk-XQHS3BBJ.mjs";
import "./chunk-PA3T6IWL.mjs";
import "./chunk-QOCJPBRB.mjs";
import "./chunk-QMRGIWOP.mjs";
import "./chunk-YFIYCS7F.mjs";
import "./chunk-ZJRFL6ZN.mjs";
import "./chunk-I3VB6NM2.mjs";
import "./chunk-XWO5BP42.mjs";
import "./chunk-O7JNIATG.mjs";
import "./chunk-TOCMU7UV.mjs";
import "./chunk-IR5DHEKS.mjs";
import "./chunk-MSDRGCRR.mjs";
import "./chunk-WG7UTTKY.mjs";
import "./chunk-VT2JJ5C2.mjs";
import "./chunk-NTEWUH4C.mjs";
import "./chunk-INE2QCSC.mjs";
import {
  useProductTableColumns
} from "./chunk-BW322BVH.mjs";
import "./chunk-XLDQPLK4.mjs";
import "./chunk-IQBAUTU5.mjs";
import "./chunk-ADOCJB6L.mjs";
import "./chunk-X6BAAGCL.mjs";
import "./chunk-P3UUX2T6.mjs";
import "./chunk-LQTHYS2Z.mjs";
import {
  _DataTable,
  useDataTable
} from "./chunk-DTZXEQXZ.mjs";
import "./chunk-HQKGZADC.mjs";
import "./chunk-EMIHDNB7.mjs";
import "./chunk-DK4WIVY6.mjs";
import "./chunk-3C6WQ7NH.mjs";
import "./chunk-CBSCX7RE.mjs";
import "./chunk-LT4MVCA7.mjs";
import "./chunk-6OU4CHZI.mjs";
import "./chunk-5FMYPGTX.mjs";
import "./chunk-W7625H47.mjs";
import "./chunk-DLZWPHHO.mjs";
import "./chunk-LSEYENCI.mjs";
import "./chunk-MFALVTRQ.mjs";
import "./chunk-RIV7FKGN.mjs";
import "./chunk-TDK3JDOB.mjs";
import "./chunk-FHSC5X62.mjs";
import "./chunk-XR4GEMGR.mjs";
import "./chunk-WRSGHGAT.mjs";
import "./chunk-MOSRJHJ3.mjs";
import "./chunk-OMC5JCQH.mjs";
import "./chunk-IW4TACOD.mjs";
import {
  useProductTableFilters
} from "./chunk-EJG5YG6V.mjs";
import {
  useProductTableQuery
} from "./chunk-R65S6ZZV.mjs";
import "./chunk-ZQJPHZKI.mjs";
import {
  SingleColumnPage
} from "./chunk-GIZFNLKK.mjs";
import "./chunk-C76H5USB.mjs";
import "./chunk-DFFLVEZ5.mjs";
import "./chunk-MNXC6Q4F.mjs";
import "./chunk-DG7J63J2.mjs";
import {
  useFeatureFlag
} from "./chunk-G4BWCU5P.mjs";
import {
  useExtension
} from "./chunk-C5P5PL3E.mjs";
import {
  SingleColumnPageSkeleton
} from "./chunk-LPEUYMRK.mjs";
import {
  ActionMenu
} from "./chunk-OZPB6JBL.mjs";
import "./chunk-OC7BQLYI.mjs";
import "./chunk-S4DMV3ZT.mjs";
import "./chunk-535OVBXR.mjs";
import {
  productTagsQueryKeys,
  useProductTag
} from "./chunk-EBARGQLA.mjs";
import "./chunk-I4OBEAOJ.mjs";
import "./chunk-HI6URQ7H.mjs";
import "./chunk-6CLQKVAU.mjs";
import "./chunk-KI7TOXBR.mjs";
import "./chunk-QBIQEVTU.mjs";
import "./chunk-C32SLRTC.mjs";
import "./chunk-WAXMT4IY.mjs";
import "./chunk-DYDGGABK.mjs";
import "./chunk-LGNTHZ5Y.mjs";
import "./chunk-CN7JXSGW.mjs";
import "./chunk-5BQQRHQS.mjs";
import "./chunk-FWRPGWPC.mjs";
import "./chunk-5AFMB7XQ.mjs";
import "./chunk-6F74MBBU.mjs";
import "./chunk-A63RZVX6.mjs";
import "./chunk-HBXV7ENS.mjs";
import "./chunk-CDORR33H.mjs";
import "./chunk-73OGFYCU.mjs";
import "./chunk-R3FD2XEU.mjs";
import "./chunk-6X2UTJF3.mjs";
import "./chunk-RNV5E7NV.mjs";
import "./chunk-3BF5SC66.mjs";
import "./chunk-VCSSQVPD.mjs";
import "./chunk-HP2JH45P.mjs";
import "./chunk-SQDIZZDW.mjs";
import {
  useProducts
} from "./chunk-3TPUO6MD.mjs";
import "./chunk-7AXHHXCX.mjs";
import {
  queryClient
} from "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import {
  sdk
} from "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/product-tags/product-tag-detail/breadcrumb.tsx
import { jsx } from "react/jsx-runtime";
var ProductTagDetailBreadcrumb = (props) => {
  const { id } = props.params || {};
  const { product_tag } = useProductTag(id, void 0, {
    initialData: props.data,
    enabled: Boolean(id)
  });
  if (!product_tag) {
    return null;
  }
  return /* @__PURE__ */ jsx("span", { children: product_tag.value });
};

// src/routes/product-tags/product-tag-detail/loader.ts
var productTagDetailQuery = (id) => ({
  queryKey: productTagsQueryKeys.detail(id),
  queryFn: async () => sdk.admin.productTag.retrieve(id)
});
var productTagLoader = async ({ params }) => {
  const id = params.id;
  const query = productTagDetailQuery(id);
  return queryClient.ensureQueryData(query);
};

// src/routes/product-tags/product-tag-detail/product-tag-detail.tsx
import { useLoaderData, useParams } from "react-router-dom";

// src/routes/product-tags/product-tag-detail/components/product-tag-general-section/product-tag-general-section.tsx
import { GlobeEurope, PencilSquare, Trash } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var ProductTagGeneralSection = ({
  productTag
}) => {
  const { t } = useTranslation();
  const handleDelete = useDeleteProductTagAction({ productTag });
  const isTranslationsEnabled = useFeatureFlag("translation");
  return /* @__PURE__ */ jsxs(Container, { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-x-1.5", children: [
      /* @__PURE__ */ jsx2("span", { className: "text-ui-fg-muted h1-core", children: "#" }),
      /* @__PURE__ */ jsx2(Heading, { children: productTag.value })
    ] }),
    /* @__PURE__ */ jsx2(
      ActionMenu,
      {
        groups: [
          {
            actions: [
              {
                icon: /* @__PURE__ */ jsx2(PencilSquare, {}),
                label: t("actions.edit"),
                to: "edit"
              }
            ]
          },
          ...isTranslationsEnabled ? [
            {
              actions: [
                {
                  label: t("translations.actions.manage"),
                  to: `/settings/translations/edit?reference=product_tag&reference_id=${productTag.id}`,
                  icon: /* @__PURE__ */ jsx2(GlobeEurope, {})
                }
              ]
            }
          ] : [],
          {
            actions: [
              {
                icon: /* @__PURE__ */ jsx2(Trash, {}),
                label: t("actions.delete"),
                onClick: handleDelete
              }
            ]
          }
        ]
      }
    )
  ] });
};

// src/routes/product-tags/product-tag-detail/components/product-tag-product-section/product-tag-product-section.tsx
import { Container as Container2, Heading as Heading2 } from "@medusajs/ui";
import { useTranslation as useTranslation2 } from "react-i18next";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var PAGE_SIZE = 10;
var PREFIX = "pt";
var ProductTagProductSection = ({
  productTag
}) => {
  const { t } = useTranslation2();
  const { searchParams, raw } = useProductTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX
  });
  const { products, count, isPending, isError, error } = useProducts({
    ...searchParams,
    tag_id: productTag.id
  });
  const filters = useProductTableFilters(["product_tags"]);
  const columns = useProductTableColumns();
  const { table } = useDataTable({
    data: products,
    count,
    columns,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX
  });
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsxs2(Container2, { className: "divide-y px-0 py-0", children: [
    /* @__PURE__ */ jsx3("div", { className: "px-6 py-4", children: /* @__PURE__ */ jsx3(Heading2, { level: "h2", children: t("products.domain") }) }),
    /* @__PURE__ */ jsx3(
      _DataTable,
      {
        table,
        filters,
        queryObject: raw,
        isLoading: isPending,
        columns,
        pageSize: PAGE_SIZE,
        count,
        navigateTo: (row) => `/products/${row.original.id}`,
        search: true,
        pagination: true,
        orderBy: [
          { key: "title", label: t("fields.title") },
          { key: "status", label: t("fields.status") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") }
        ]
      }
    )
  ] });
};

// src/routes/product-tags/product-tag-detail/product-tag-detail.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var ProductTagDetail = () => {
  const { id } = useParams();
  const initialData = useLoaderData();
  const { getWidgets } = useExtension();
  const { product_tag, isPending, isError, error } = useProductTag(
    id,
    void 0,
    {
      initialData
    }
  );
  if (isPending || !product_tag) {
    return /* @__PURE__ */ jsx4(SingleColumnPageSkeleton, { showJSON: true, sections: 2 });
  }
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsxs3(
    SingleColumnPage,
    {
      widgets: {
        after: getWidgets("product_tag.details.after"),
        before: getWidgets("product_tag.details.before")
      },
      showJSON: true,
      showMetadata: true,
      data: product_tag,
      children: [
        /* @__PURE__ */ jsx4(ProductTagGeneralSection, { productTag: product_tag }),
        /* @__PURE__ */ jsx4(ProductTagProductSection, { productTag: product_tag })
      ]
    }
  );
};
export {
  ProductTagDetailBreadcrumb as Breadcrumb,
  ProductTagDetail as Component,
  productTagLoader as loader
};
