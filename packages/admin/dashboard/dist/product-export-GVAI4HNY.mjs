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
import {
  DataTableFilter
} from "./chunk-ZQJPHZKI.mjs";
import "./chunk-C76H5USB.mjs";
import "./chunk-DFFLVEZ5.mjs";
import {
  RouteDrawer
} from "./chunk-WVA4O7QS.mjs";
import {
  useRouteModal
} from "./chunk-D6UW7URG.mjs";
import "./chunk-535OVBXR.mjs";
import "./chunk-OBQI23QM.mjs";
import "./chunk-EBARGQLA.mjs";
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
  useExportProducts
} from "./chunk-3TPUO6MD.mjs";
import "./chunk-7AXHHXCX.mjs";
import "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/products/product-export/product-export.tsx
import { Button, Heading as Heading2, toast } from "@medusajs/ui";
import { useTranslation as useTranslation2 } from "react-i18next";

// src/routes/products/product-export/components/export-filters.tsx
import { Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { jsx, jsxs } from "react/jsx-runtime";
var ExportFilters = () => {
  const { t } = useTranslation();
  const filters = useProductTableFilters();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Heading, { level: "h2", children: t("products.export.filters.title") }),
    /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: t("products.export.filters.description") }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(DataTableFilter, { filters, readonly: true }) })
  ] });
};

// src/routes/products/product-export/product-export.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var ProductExport = () => {
  const { t } = useTranslation2();
  return /* @__PURE__ */ jsxs2(RouteDrawer, { children: [
    /* @__PURE__ */ jsxs2(RouteDrawer.Header, { children: [
      /* @__PURE__ */ jsx2(RouteDrawer.Title, { asChild: true, children: /* @__PURE__ */ jsx2(Heading2, { children: t("products.export.header") }) }),
      /* @__PURE__ */ jsx2(RouteDrawer.Description, { className: "sr-only", children: t("products.export.description") })
    ] }),
    /* @__PURE__ */ jsx2(ProductExportContent, {})
  ] });
};
var ProductExportContent = () => {
  const { t } = useTranslation2();
  const { searchParams } = useProductTableQuery({});
  const { mutateAsync } = useExportProducts({ ...searchParams });
  const { handleSuccess } = useRouteModal();
  const handleExportRequest = async () => {
    await mutateAsync(searchParams, {
      onSuccess: () => {
        toast.info(t("products.export.success.title"), {
          description: t("products.export.success.description")
        });
        handleSuccess();
      },
      onError: (err) => {
        toast.error(err.message);
      }
    });
  };
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2(RouteDrawer.Body, { children: /* @__PURE__ */ jsx2(ExportFilters, {}) }),
    /* @__PURE__ */ jsx2(RouteDrawer.Footer, { children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-x-2", children: [
      /* @__PURE__ */ jsx2(RouteDrawer.Close, { asChild: true, children: /* @__PURE__ */ jsx2(Button, { size: "small", variant: "secondary", children: t("actions.cancel") }) }),
      /* @__PURE__ */ jsx2(Button, { onClick: handleExportRequest, size: "small", children: t("actions.export") })
    ] }) })
  ] });
};
export {
  ProductExport as Component
};
