import "./chunk-XRTVFYCW.mjs";
import {
  MetadataForm
} from "./chunk-N3SAXQVR.mjs";
import "./chunk-IUCDCPJU.mjs";
import "./chunk-6HTZNHPT.mjs";
import {
  RouteDrawer
} from "./chunk-WVA4O7QS.mjs";
import "./chunk-D6UW7URG.mjs";
import "./chunk-LPEUYMRK.mjs";
import "./chunk-OC7BQLYI.mjs";
import "./chunk-S4DMV3ZT.mjs";
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
import {
  useProductCategory,
  useUpdateProductCategory
} from "./chunk-6X2UTJF3.mjs";
import "./chunk-RNV5E7NV.mjs";
import "./chunk-3BF5SC66.mjs";
import "./chunk-VCSSQVPD.mjs";
import "./chunk-HP2JH45P.mjs";
import "./chunk-SQDIZZDW.mjs";
import "./chunk-3TPUO6MD.mjs";
import "./chunk-7AXHHXCX.mjs";
import "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/categories/categories-metadata/categories-metadata.tsx
import { useParams } from "react-router-dom";
import { jsx } from "react/jsx-runtime";
var CategoriesMetadata = () => {
  const { id } = useParams();
  const { product_category, isPending, isError, error } = useProductCategory(id);
  const { mutateAsync, isPending: isMutating } = useUpdateProductCategory(id);
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsx(RouteDrawer, { children: /* @__PURE__ */ jsx(
    MetadataForm,
    {
      isPending,
      isMutating,
      hook: mutateAsync,
      metadata: product_category?.metadata
    }
  ) });
};
export {
  CategoriesMetadata as Component
};
