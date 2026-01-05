import {
  useProductTableColumns
} from "./chunk-BW322BVH.mjs";
import "./chunk-XLDQPLK4.mjs";
import "./chunk-IQBAUTU5.mjs";
import "./chunk-ADOCJB6L.mjs";
import "./chunk-P3UUX2T6.mjs";
import {
  _DataTable,
  useDataTable
} from "./chunk-DTZXEQXZ.mjs";
import "./chunk-HQKGZADC.mjs";
import "./chunk-EMIHDNB7.mjs";
import {
  useProductTableFilters
} from "./chunk-EJG5YG6V.mjs";
import {
  useProductTableQuery
} from "./chunk-R65S6ZZV.mjs";
import "./chunk-ZQJPHZKI.mjs";
import "./chunk-C76H5USB.mjs";
import "./chunk-DFFLVEZ5.mjs";
import {
  KeyboundForm
} from "./chunk-6HTZNHPT.mjs";
import "./chunk-WVA4O7QS.mjs";
import {
  RouteFocusModal,
  useRouteModal
} from "./chunk-D6UW7URG.mjs";
import "./chunk-MNXC6Q4F.mjs";
import "./chunk-LPEUYMRK.mjs";
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
import {
  useCollection,
  useUpdateCollectionProducts
} from "./chunk-6F74MBBU.mjs";
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
import "./chunk-FXYH54JP.mjs";
import "./chunk-774WSTCC.mjs";
import "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/collections/collection-add-products/collection-add-products.tsx
import { useParams } from "react-router-dom";

// src/routes/collections/collection-add-products/components/add-products-to-collection-form/add-products-to-collection-form.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, Hint, Tooltip, toast } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import {
  createColumnHelper
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { jsx, jsxs } from "react/jsx-runtime";
var AddProductsToCollectionSchema = zod.object({
  add: zod.array(zod.string()).min(1)
});
var PAGE_SIZE = 50;
var PREFIX = "p";
var AddProductsToCollectionForm = ({
  collection
}) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const form = useForm({
    defaultValues: {
      add: []
    },
    resolver: zodResolver(AddProductsToCollectionSchema)
  });
  const { setValue } = form;
  const { mutateAsync, isPending: isMutating } = useUpdateCollectionProducts(
    collection.id
  );
  const [rowSelection, setRowSelection] = useState({});
  const updater = (newSelection) => {
    const update = typeof newSelection === "function" ? newSelection(rowSelection) : newSelection;
    setValue(
      "add",
      Object.keys(update).filter((k) => update[k]),
      {
        shouldDirty: true,
        shouldTouch: true
      }
    );
    setRowSelection(update);
  };
  useEffect(() => {
    setValue(
      "add",
      Object.keys(rowSelection).filter((k) => rowSelection[k]),
      {
        shouldDirty: true,
        shouldTouch: true
      }
    );
  }, [rowSelection, setValue]);
  const { searchParams, raw } = useProductTableQuery({
    prefix: PREFIX,
    pageSize: PAGE_SIZE
  });
  const { products, count, isLoading, isError, error } = useProducts(
    {
      fields: "*variants,*sales_channels",
      ...searchParams
    },
    {
      placeholderData: keepPreviousData
    }
  );
  const columns = useColumns();
  const filters = useProductTableFilters(["collections"]);
  const { table } = useDataTable({
    data: products ?? [],
    columns,
    count,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    rowSelection: {
      state: rowSelection,
      updater
    },
    enablePagination: true,
    meta: {
      collectionId: collection.id
    }
  });
  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        add: values.add
      },
      {
        onSuccess: () => {
          toast.success(
            t("collections.products.add.successToast", {
              count: values.add.length
            })
          );
          handleSuccess();
        },
        onError: (e) => {
          toast.error(e.message);
        }
      }
    );
  });
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsx(RouteFocusModal.Form, { form, children: /* @__PURE__ */ jsxs(
    KeyboundForm,
    {
      onSubmit: handleSubmit,
      className: "flex h-full flex-col overflow-hidden",
      children: [
        /* @__PURE__ */ jsx(RouteFocusModal.Header, { children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-x-2", children: form.formState.errors.add && /* @__PURE__ */ jsx(Hint, { variant: "error", children: form.formState.errors.add.message }) }) }),
        /* @__PURE__ */ jsx(RouteFocusModal.Body, { className: "size-full overflow-hidden", children: /* @__PURE__ */ jsx(
          _DataTable,
          {
            table,
            columns,
            pageSize: PAGE_SIZE,
            count,
            queryObject: raw,
            filters,
            orderBy: [
              { key: "title", label: t("fields.title") },
              { key: "created_at", label: t("fields.createdAt") },
              { key: "updated_at", label: t("fields.updatedAt") }
            ],
            prefix: PREFIX,
            isLoading,
            layout: "fill",
            pagination: true,
            search: "autofocus"
          }
        ) }),
        /* @__PURE__ */ jsxs(RouteFocusModal.Footer, { children: [
          /* @__PURE__ */ jsx(RouteFocusModal.Close, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "small", variant: "secondary", children: t("actions.cancel") }) }),
          /* @__PURE__ */ jsx(Button, { size: "small", type: "submit", isLoading: isMutating, children: t("actions.save") })
        ] })
      ]
    }
  ) });
};
var columnHelper = createColumnHelper();
var useColumns = () => {
  const { t } = useTranslation();
  const base = useProductTableColumns();
  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          return /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: table.getIsSomePageRowsSelected() ? "indeterminate" : table.getIsAllPageRowsSelected(),
              onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value)
            }
          );
        },
        cell: ({ row, table }) => {
          const { collectionId } = table.options.meta;
          const isAdded = row.original.collection_id === collectionId;
          const isSelected = row.getIsSelected() || isAdded;
          const Component = /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: isSelected,
              disabled: isAdded,
              onCheckedChange: (value) => row.toggleSelected(!!value),
              onClick: (e) => {
                e.stopPropagation();
              }
            }
          );
          if (isAdded) {
            return /* @__PURE__ */ jsx(
              Tooltip,
              {
                content: t("salesChannels.productAlreadyAdded"),
                side: "right",
                children: Component
              }
            );
          }
          return Component;
        }
      }),
      ...base
    ],
    [t, base]
  );
};

// src/routes/collections/collection-add-products/collection-add-products.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var CollectionAddProducts = () => {
  const { id } = useParams();
  const { collection, isLoading, isError, error } = useCollection(id);
  if (isError) {
    throw error;
  }
  return /* @__PURE__ */ jsx2(RouteFocusModal, { children: !isLoading && collection && /* @__PURE__ */ jsx2(AddProductsToCollectionForm, { collection }) });
};
export {
  CollectionAddProducts as Component
};
