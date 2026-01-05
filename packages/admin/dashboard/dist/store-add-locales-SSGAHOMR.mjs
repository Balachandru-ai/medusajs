import {
  AddLocalesForm
} from "./chunk-VAX6I2W7.mjs";
import "./chunk-XNIVMZHA.mjs";
import "./chunk-MSDRGCRR.mjs";
import "./chunk-P3UUX2T6.mjs";
import "./chunk-LQTHYS2Z.mjs";
import "./chunk-DTZXEQXZ.mjs";
import "./chunk-HQKGZADC.mjs";
import "./chunk-EMIHDNB7.mjs";
import "./chunk-ZQJPHZKI.mjs";
import "./chunk-C76H5USB.mjs";
import "./chunk-DFFLVEZ5.mjs";
import "./chunk-IUCDCPJU.mjs";
import "./chunk-6HTZNHPT.mjs";
import {
  RouteFocusModal
} from "./chunk-D6UW7URG.mjs";
import {
  useFeatureFlag
} from "./chunk-G4BWCU5P.mjs";
import "./chunk-LPEUYMRK.mjs";
import "./chunk-OC7BQLYI.mjs";
import "./chunk-S4DMV3ZT.mjs";
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
import {
  useStore
} from "./chunk-VCSSQVPD.mjs";
import "./chunk-HP2JH45P.mjs";
import "./chunk-SQDIZZDW.mjs";
import "./chunk-3TPUO6MD.mjs";
import "./chunk-7AXHHXCX.mjs";
import "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/store/store-add-locales/store-add-locales.tsx
import { useNavigate } from "react-router-dom";
import { jsx } from "react/jsx-runtime";
var StoreAddLocales = () => {
  const isEnabled = useFeatureFlag("translation");
  const navigate = useNavigate();
  if (!isEnabled) {
    navigate(-1);
    return null;
  }
  const { store, isPending, isError, error } = useStore();
  const ready = !!store && !isPending;
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsx(RouteFocusModal, { children: ready && /* @__PURE__ */ jsx(AddLocalesForm, { store }) });
};
export {
  StoreAddLocales as Component
};
