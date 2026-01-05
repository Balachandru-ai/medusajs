import {
  useOrderTableColumns
} from "./chunk-TOCMU7UV.mjs";
import {
  useOrderTableFilters
} from "./chunk-JUZ754L2.mjs";
import {
  ConfigurableDataTable,
  createTableAdapter,
  orderColumnAdapter
} from "./chunk-FBYTX6K7.mjs";
import "./chunk-WG7UTTKY.mjs";
import "./chunk-VT2JJ5C2.mjs";
import "./chunk-NTEWUH4C.mjs";
import "./chunk-INE2QCSC.mjs";
import "./chunk-XLDQPLK4.mjs";
import "./chunk-IQBAUTU5.mjs";
import "./chunk-ADOCJB6L.mjs";
import "./chunk-X6BAAGCL.mjs";
import "./chunk-P3UUX2T6.mjs";
import {
  _DataTable,
  useDataTable
} from "./chunk-DTZXEQXZ.mjs";
import "./chunk-HQKGZADC.mjs";
import "./chunk-EMIHDNB7.mjs";
import "./chunk-DK4WIVY6.mjs";
import {
  useOrderTableQuery
} from "./chunk-IW4TACOD.mjs";
import "./chunk-ZQJPHZKI.mjs";
import {
  SingleColumnPage
} from "./chunk-GIZFNLKK.mjs";
import "./chunk-KCWP7RF5.mjs";
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
import "./chunk-OZPB6JBL.mjs";
import "./chunk-OC7BQLYI.mjs";
import "./chunk-S4DMV3ZT.mjs";
import "./chunk-535OVBXR.mjs";
import {
  useOrders
} from "./chunk-73OGFYCU.mjs";
import "./chunk-R3FD2XEU.mjs";
import "./chunk-RNV5E7NV.mjs";
import "./chunk-3BF5SC66.mjs";
import "./chunk-HP2JH45P.mjs";
import "./chunk-SQDIZZDW.mjs";
import "./chunk-3TPUO6MD.mjs";
import "./chunk-7AXHHXCX.mjs";
import "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/orders/order-list/components/order-list-table/order-list-table.tsx
import { Button, Container, Heading } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation as useTranslation2 } from "react-i18next";
import { Link, Outlet as Outlet2, useLocation as useLocation2 } from "react-router-dom";

// src/routes/orders/order-list/components/order-list-table/configurable-order-list-table.tsx
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";

// src/routes/orders/order-list/components/order-list-table/order-table-adapter.tsx
function createOrderTableAdapter() {
  return createTableAdapter({
    entity: "orders",
    queryPrefix: "o",
    pageSize: 20,
    columnAdapter: orderColumnAdapter,
    useData: (fields, params) => {
      const { orders, count, isError, error, isLoading } = useOrders(
        {
          fields,
          ...params
        },
        {
          placeholderData: (previousData, previousQuery) => {
            const prevFields = previousQuery?.[previousQuery.length - 1]?.query?.fields;
            if (prevFields && prevFields !== fields) {
              return void 0;
            }
            return previousData;
          }
        }
      );
      return {
        data: orders,
        count,
        isLoading,
        isError,
        error
      };
    },
    getRowHref: (row) => `/orders/${row.id}`,
    emptyState: {
      empty: {
        heading: "No orders found"
      }
    }
  });
}
function useOrderTableAdapter() {
  const filters = useOrderTableFilters();
  const adapter = createOrderTableAdapter();
  return {
    ...adapter,
    filters
  };
}

// src/routes/orders/order-list/components/order-list-table/configurable-order-list-table.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var ConfigurableOrderListTable = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const adapter = useOrderTableAdapter();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      ConfigurableDataTable,
      {
        adapter,
        heading: t("orders.domain"),
        actions: [
          { label: t("actions.export"), to: `export${location.search}` }
        ]
      }
    ),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
};

// src/routes/orders/order-list/const.ts
var DEFAULT_PROPERTIES = [
  "id",
  "status",
  "created_at",
  "email",
  "display_id",
  "custom_display_id",
  "payment_status",
  "fulfillment_status",
  "total",
  "currency_code"
];
var DEFAULT_RELATIONS = ["*customer", "*sales_channel", "*payment_collections"];
var DEFAULT_FIELDS = `${DEFAULT_PROPERTIES.join(
  ","
)},${DEFAULT_RELATIONS.join(",")}`;

// src/routes/orders/order-list/components/order-list-table/order-list-table.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var PAGE_SIZE = 20;
var OrderListTable = () => {
  const { t } = useTranslation2();
  const location = useLocation2();
  const isViewConfigEnabled = useFeatureFlag("view_configurations");
  if (isViewConfigEnabled) {
    return /* @__PURE__ */ jsx2(ConfigurableOrderListTable, {});
  }
  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE
  });
  const { orders, count, isError, error, isLoading } = useOrders(
    {
      fields: DEFAULT_FIELDS,
      ...searchParams
    },
    {
      placeholderData: keepPreviousData
    }
  );
  const filters = useOrderTableFilters();
  const columns = useOrderTableColumns({});
  const { table } = useDataTable({
    data: orders ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE
  });
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsxs2(Container, { className: "divide-y p-0", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between px-6 py-4", children: [
      /* @__PURE__ */ jsx2(Heading, { children: t("orders.domain") }),
      /* @__PURE__ */ jsx2(Button, { size: "small", variant: "secondary", asChild: true, children: /* @__PURE__ */ jsx2(Link, { to: `export${location.search}`, children: t("actions.export") }) })
    ] }),
    /* @__PURE__ */ jsx2(
      _DataTable,
      {
        columns,
        table,
        pagination: true,
        navigateTo: (row) => `/orders/${row.original.id}`,
        filters,
        count,
        search: true,
        isLoading,
        pageSize: PAGE_SIZE,
        orderBy: [
          { key: "display_id", label: t("orders.fields.displayId") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") }
        ],
        queryObject: raw,
        noRecords: {
          message: t("orders.list.noRecordsMessage")
        }
      }
    ),
    /* @__PURE__ */ jsx2(Outlet2, {})
  ] });
};

// src/routes/orders/order-list/order-list.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var OrderList = () => {
  const { getWidgets } = useExtension();
  return /* @__PURE__ */ jsx3(
    SingleColumnPage,
    {
      widgets: {
        after: getWidgets("order.list.after"),
        before: getWidgets("order.list.before")
      },
      hasOutlet: false,
      children: /* @__PURE__ */ jsx3(OrderListTable, {})
    }
  );
};
export {
  OrderList as Component
};
