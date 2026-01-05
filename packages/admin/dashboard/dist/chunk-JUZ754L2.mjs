import {
  useSalesChannels
} from "./chunk-RNV5E7NV.mjs";
import {
  useRegions
} from "./chunk-HP2JH45P.mjs";

// src/routes/orders/order-list/components/order-list-table/use-order-table-filters.tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
var useOrderTableFilters = () => {
  const { t } = useTranslation();
  const { regions } = useRegions({
    limit: 1e3,
    fields: "id,name"
  });
  const { sales_channels } = useSalesChannels({
    limit: 1e3,
    fields: "id,name"
  });
  return useMemo(() => {
    const filters = [
      {
        key: "created_at",
        label: t("fields.createdAt"),
        type: "date"
      },
      {
        key: "updated_at",
        label: t("fields.updatedAt"),
        type: "date"
      }
    ];
    if (regions?.length) {
      filters.push({
        key: "region_id",
        label: t("fields.region"),
        type: "select",
        multiple: true,
        searchable: true,
        options: regions.map((r) => ({
          label: r.name,
          value: r.id
        }))
      });
    }
    if (sales_channels?.length) {
      filters.push({
        key: "sales_channel_id",
        label: t("fields.salesChannel"),
        type: "select",
        multiple: true,
        searchable: true,
        options: sales_channels.map((s) => ({
          label: s.name,
          value: s.id
        }))
      });
    }
    return filters;
  }, [regions, sales_channels, t]);
};

export {
  useOrderTableFilters
};
