import {
  useDeleteProductTagAction
} from "./chunk-XQHS3BBJ.mjs";
import {
  useProductTagTableColumns
} from "./chunk-PA3T6IWL.mjs";
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
import "./chunk-BW322BVH.mjs";
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
import {
  useProductTagTableFilters
} from "./chunk-3C6WQ7NH.mjs";
import "./chunk-CBSCX7RE.mjs";
import "./chunk-LT4MVCA7.mjs";
import "./chunk-6OU4CHZI.mjs";
import "./chunk-5FMYPGTX.mjs";
import "./chunk-W7625H47.mjs";
import "./chunk-DLZWPHHO.mjs";
import "./chunk-LSEYENCI.mjs";
import {
  useProductTagTableQuery
} from "./chunk-MFALVTRQ.mjs";
import "./chunk-RIV7FKGN.mjs";
import "./chunk-TDK3JDOB.mjs";
import "./chunk-FHSC5X62.mjs";
import "./chunk-XR4GEMGR.mjs";
import "./chunk-WRSGHGAT.mjs";
import "./chunk-MOSRJHJ3.mjs";
import "./chunk-OMC5JCQH.mjs";
import "./chunk-IW4TACOD.mjs";
import "./chunk-EJG5YG6V.mjs";
import "./chunk-R65S6ZZV.mjs";
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
import "./chunk-LPEUYMRK.mjs";
import {
  ActionMenu
} from "./chunk-OZPB6JBL.mjs";
import "./chunk-OC7BQLYI.mjs";
import "./chunk-S4DMV3ZT.mjs";
import "./chunk-535OVBXR.mjs";
import {
  productTagsQueryKeys,
  useProductTags
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
import "./chunk-3TPUO6MD.mjs";
import "./chunk-7AXHHXCX.mjs";
import {
  queryClient
} from "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import {
  sdk
} from "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/product-tags/product-tag-list/loader.ts
var productTagListQuery = (query) => ({
  queryKey: productTagsQueryKeys.list(query),
  queryFn: async () => sdk.admin.productTag.list(query)
});
var productTagListLoader = async ({ request }) => {
  const searchParams = new URL(request.url).searchParams;
  const queryObject = {};
  searchParams.forEach((value, key) => {
    try {
      queryObject[key] = JSON.parse(value);
    } catch (_e) {
      queryObject[key] = value;
    }
  });
  const query = productTagListQuery(
    queryObject
  );
  return queryClient.getQueryData(query.queryKey) ?? await queryClient.fetchQuery(query);
};

// src/routes/product-tags/product-tag-list/components/product-tag-list-table/product-tag-list-table.tsx
import { GlobeEurope, PencilSquare, Trash } from "@medusajs/icons";
import { Button, Container, Heading } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLoaderData } from "react-router-dom";
import { jsx, jsxs } from "react/jsx-runtime";
var PAGE_SIZE = 20;
var ProductTagListTable = () => {
  const { t } = useTranslation();
  const { searchParams, raw } = useProductTagTableQuery({
    pageSize: PAGE_SIZE
  });
  const initialData = useLoaderData();
  const { product_tags, count, isPending, isError, error } = useProductTags(
    searchParams,
    {
      initialData,
      placeholderData: keepPreviousData
    }
  );
  const columns = useColumns();
  const filters = useProductTagTableFilters();
  const { table } = useDataTable({
    data: product_tags,
    count,
    columns,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE
  });
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsxs(Container, { className: "divide-y px-0 py-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
      /* @__PURE__ */ jsx(Heading, { children: t("productTags.domain") }),
      /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "small", asChild: true, children: /* @__PURE__ */ jsx(Link, { to: "create", children: t("actions.create") }) })
    ] }),
    /* @__PURE__ */ jsx(
      _DataTable,
      {
        table,
        filters,
        queryObject: raw,
        isLoading: isPending,
        columns,
        pageSize: PAGE_SIZE,
        count,
        navigateTo: (row) => row.original.id,
        search: true,
        pagination: true,
        orderBy: [
          { key: "value", label: t("fields.value") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") }
        ]
      }
    )
  ] });
};
var ProductTagRowActions = ({
  productTag
}) => {
  const { t } = useTranslation();
  const handleDelete = useDeleteProductTagAction({ productTag });
  const isTranslationsEnabled = useFeatureFlag("translation");
  return /* @__PURE__ */ jsx(
    ActionMenu,
    {
      groups: [
        {
          actions: [
            {
              icon: /* @__PURE__ */ jsx(PencilSquare, {}),
              label: t("actions.edit"),
              to: `${productTag.id}/edit`
            }
          ]
        },
        ...isTranslationsEnabled ? [
          {
            actions: [
              {
                icon: /* @__PURE__ */ jsx(GlobeEurope, {}),
                label: t("translations.actions.manage"),
                to: `/settings/translations/edit?reference=product_tag&reference_id=${productTag.id}`
              }
            ]
          }
        ] : [],
        {
          actions: [
            {
              icon: /* @__PURE__ */ jsx(Trash, {}),
              label: t("actions.delete"),
              onClick: handleDelete
            }
          ]
        }
      ]
    }
  );
};
var columnHelper = createColumnHelper();
var useColumns = () => {
  const base = useProductTagTableColumns();
  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => /* @__PURE__ */ jsx(ProductTagRowActions, { productTag: row.original })
      })
    ],
    [base]
  );
};

// src/routes/product-tags/product-tag-list/product-tag-list.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var ProductTagList = () => {
  const { getWidgets } = useExtension();
  return /* @__PURE__ */ jsx2(
    SingleColumnPage,
    {
      showMetadata: false,
      showJSON: false,
      hasOutlet: true,
      widgets: {
        after: getWidgets("product_tag.list.after"),
        before: getWidgets("product_tag.list.before")
      },
      children: /* @__PURE__ */ jsx2(ProductTagListTable, {})
    }
  );
};
export {
  ProductTagList as Component,
  productTagListLoader as loader
};
