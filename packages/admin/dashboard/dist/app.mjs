import {
  DashboardApp
} from "./chunk-HT4PJASI.mjs";
import "./chunk-2SSUH2HJ.mjs";
import "./chunk-ONB3JEHR.mjs";
import "./chunk-YCDDT44O.mjs";
import "./chunk-4GQOUCX6.mjs";
import "./chunk-RYJ2UVJE.mjs";
import "./chunk-D3YQN7HV.mjs";
import "./chunk-PMA2D6IL.mjs";
import "./chunk-MNXC6Q4F.mjs";
import "./chunk-DG7J63J2.mjs";
import "./chunk-G4BWCU5P.mjs";
import "./chunk-C5P5PL3E.mjs";
import "./chunk-LPEUYMRK.mjs";
import "./chunk-ZCARHA6C.mjs";
import "./chunk-OZPB6JBL.mjs";
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
import "./chunk-VCSSQVPD.mjs";
import "./chunk-HP2JH45P.mjs";
import "./chunk-SQDIZZDW.mjs";
import "./chunk-3TPUO6MD.mjs";
import "./chunk-7AXHHXCX.mjs";
import "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/app.tsx
import displayModule from "virtual:medusa/displays";
import formModule from "virtual:medusa/forms";
import i18nModule from "virtual:medusa/i18n";
import menuItemModule from "virtual:medusa/menu-items";
import routeModule from "virtual:medusa/routes";
import widgetModule from "virtual:medusa/widgets";
import { jsx } from "react/jsx-runtime";
var localPlugin = {
  widgetModule,
  routeModule,
  displayModule,
  formModule,
  menuItemModule,
  i18nModule
};
function App({ plugins = [] }) {
  const app = new DashboardApp({
    plugins: [localPlugin, ...plugins]
  });
  return /* @__PURE__ */ jsx("div", { children: app.render() });
}
var app_default = App;
export {
  app_default as default
};
