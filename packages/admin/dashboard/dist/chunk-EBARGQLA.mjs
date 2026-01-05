import {
  ordersQueryKeys
} from "./chunk-73OGFYCU.mjs";
import {
  queryClient
} from "./chunk-FXYH54JP.mjs";
import {
  queryKeysFactory
} from "./chunk-774WSTCC.mjs";
import {
  sdk
} from "./chunk-NFEK63OE.mjs";

// src/hooks/api/cloud.tsx
import {
  useMutation,
  useQuery
} from "@tanstack/react-query";
var cloudQueryKeys = {
  all: ["cloud"],
  auth: () => [...cloudQueryKeys.all, "auth"]
};
var useCloudAuthEnabled = (options) => {
  return useQuery({
    queryKey: cloudQueryKeys.auth(),
    queryFn: async () => {
      return await sdk.client.fetch("/cloud/auth");
    },
    ...options
  });
};
var useCreateCloudAuthUser = (options) => {
  return useMutation({
    mutationFn: async () => {
      await sdk.client.fetch("/cloud/auth/users", {
        method: "POST"
      });
    },
    ...options
  });
};

// src/hooks/api/plugins.tsx
import { useQuery as useQuery2 } from "@tanstack/react-query";
var PLUGINS_QUERY_KEY = "plugins";
var pluginsQueryKeys = queryKeysFactory(PLUGINS_QUERY_KEY);
var usePlugins = (options) => {
  const { data, ...rest } = useQuery2({
    queryFn: () => sdk.admin.plugin.list(),
    queryKey: pluginsQueryKeys.list(),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/product-variants.tsx
import {
  useQuery as useQuery3
} from "@tanstack/react-query";
var PRODUCT_VARIANT_QUERY_KEY = "product_variant";
var productVariantQueryKeys = queryKeysFactory(
  PRODUCT_VARIANT_QUERY_KEY
);
var useVariants = (query, options) => {
  const { data, ...rest } = useQuery3({
    queryFn: () => sdk.admin.productVariant.list(query),
    queryKey: productVariantQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/refund-reasons.tsx
import {
  useMutation as useMutation2,
  useQuery as useQuery4
} from "@tanstack/react-query";
var REFUND_REASONS_QUERY_KEY = "refund_reasons";
var refundReasonsQueryKeys = queryKeysFactory(REFUND_REASONS_QUERY_KEY);
var useRefundReasons = (query, options) => {
  const { data, ...rest } = useQuery4({
    queryFn: () => sdk.admin.refundReason.list(query),
    queryKey: refundReasonsQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};
var useRefundReason = (id, query, options) => {
  const { data, ...rest } = useQuery4({
    queryFn: () => sdk.admin.refundReason.retrieve(id, query),
    queryKey: refundReasonsQueryKeys.detail(id),
    ...options
  });
  return { ...data, ...rest };
};
var useCreateRefundReason = (query, options) => {
  return useMutation2({
    mutationFn: async (data) => sdk.admin.refundReason.create(data, query),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useUpdateRefundReason = (id, options) => {
  return useMutation2({
    mutationFn: async (data) => sdk.admin.refundReason.update(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.detail(data.refund_reason.id)
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useDeleteRefundReasonLazy = (options) => {
  return useMutation2({
    mutationFn: (id) => sdk.admin.refundReason.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.details()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

// src/hooks/api/shipping-option-types.tsx
import {
  useMutation as useMutation3,
  useQuery as useQuery5
} from "@tanstack/react-query";
var SHIPPING_OPTION_TYPES_QUERY_KEY = "shipping_option_types";
var shippingOptionTypesQueryKeys = queryKeysFactory(
  SHIPPING_OPTION_TYPES_QUERY_KEY
);
var useShippingOptionType = (id, query, options) => {
  const { data, ...rest } = useQuery5({
    queryFn: () => sdk.admin.shippingOptionType.retrieve(id, query),
    queryKey: shippingOptionTypesQueryKeys.detail(id),
    ...options
  });
  return { ...data, ...rest };
};
var useShippingOptionTypes = (query, options) => {
  const { data, ...rest } = useQuery5({
    queryFn: () => sdk.admin.shippingOptionType.list(query),
    queryKey: shippingOptionTypesQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};
var useCreateShippingOptionType = (options) => {
  return useMutation3({
    mutationFn: (payload) => sdk.admin.shippingOptionType.create(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useUpdateShippingOptionType = (id, options) => {
  return useMutation3({
    mutationFn: (payload) => sdk.admin.shippingOptionType.update(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useDeleteShippingOptionType = (id, options) => {
  return useMutation3({
    mutationFn: () => sdk.admin.shippingOptionType.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

// src/hooks/api/tags.tsx
import {
  useMutation as useMutation4,
  useQuery as useQuery6
} from "@tanstack/react-query";
var TAGS_QUERY_KEY = "tags";
var productTagsQueryKeys = queryKeysFactory(TAGS_QUERY_KEY);
var useProductTag = (id, query, options) => {
  const { data, ...rest } = useQuery6({
    queryKey: productTagsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.productTag.retrieve(id),
    ...options
  });
  return { ...data, ...rest };
};
var useProductTags = (query, options) => {
  const { data, ...rest } = useQuery6({
    queryKey: productTagsQueryKeys.list(query),
    queryFn: async () => sdk.admin.productTag.list(query),
    ...options
  });
  return { ...data, ...rest };
};
var useCreateProductTag = (query, options) => {
  return useMutation4({
    mutationFn: async (data) => sdk.admin.productTag.create(data, query),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useUpdateProductTag = (id, query, options) => {
  return useMutation4({
    mutationFn: async (data) => sdk.admin.productTag.update(id, data, query),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(data.product_tag.id, query)
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useDeleteProductTag = (id, options) => {
  return useMutation4({
    mutationFn: async () => sdk.admin.productTag.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(id)
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

// src/hooks/api/translations.tsx
import {
  useInfiniteQuery,
  useMutation as useMutation5,
  useQuery as useQuery7
} from "@tanstack/react-query";
var TRANSLATIONS_QUERY_KEY = "translations";
var translationsQueryKeys = queryKeysFactory(TRANSLATIONS_QUERY_KEY);
var TRANSLATION_SETTINGS_QUERY_KEY = "translation_settings";
var translationSettingsQueryKeys = queryKeysFactory(
  TRANSLATION_SETTINGS_QUERY_KEY
);
var TRANSLATION_STATISTICS_QUERY_KEY = "translation_statistics";
var translationStatisticsQueryKeys = queryKeysFactory(
  TRANSLATION_STATISTICS_QUERY_KEY
);
var TRANSLATION_ENTITIES_QUERY_KEY = "translation_entities";
var translationEntitiesQueryKeys = queryKeysFactory(
  TRANSLATION_ENTITIES_QUERY_KEY
);
var DEFAULT_PAGE_SIZE = 20;
var useReferenceTranslations = (reference, referenceId, options) => {
  const { data, ...rest } = useInfiniteQuery({
    queryKey: translationEntitiesQueryKeys.list({
      type: reference,
      id: referenceId
    }),
    queryFn: async ({ pageParam = 0 }) => {
      return sdk.admin.translation.entities({
        type: reference,
        id: referenceId,
        limit: DEFAULT_PAGE_SIZE,
        offset: pageParam
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.limit;
      return nextOffset < lastPage.count ? nextOffset : void 0;
    },
    ...options
  });
  const entitiesWithTranslations = data?.pages.flatMap((page) => page.data) ?? [];
  const translations = entitiesWithTranslations.flatMap(
    (entity) => entity.translations ?? []
  );
  const references = entitiesWithTranslations.map(
    ({ translations: _, ...entity }) => entity
  );
  const count = data?.pages[0]?.count ?? 0;
  return {
    references,
    translations,
    count,
    ...rest
  };
};
var useBatchTranslations = (reference, options) => {
  const mutation = useMutation5({
    mutationFn: (payload) => sdk.admin.translation.batch(payload),
    ...options
  });
  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: translationEntitiesQueryKeys.list({ type: reference })
      }),
      queryClient.invalidateQueries({
        queryKey: translationStatisticsQueryKeys.lists()
      })
    ]);
  };
  return {
    ...mutation,
    invalidateQueries
  };
};
var useTranslationSettings = (query, options) => {
  const { data, ...rest } = useQuery7({
    queryKey: translationSettingsQueryKeys.list(query),
    queryFn: () => sdk.admin.translation.settings(query),
    ...options
  });
  return { ...data, ...rest };
};
var useTranslationStatistics = (query, options) => {
  const { data, ...rest } = useQuery7({
    queryKey: translationStatisticsQueryKeys.list(query),
    queryFn: () => sdk.admin.translation.statistics(query),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/fulfillment.tsx
import { useMutation as useMutation6 } from "@tanstack/react-query";
var FULFILLMENTS_QUERY_KEY = "fulfillments";
var fulfillmentsQueryKeys = queryKeysFactory(FULFILLMENTS_QUERY_KEY);

// src/hooks/api/locales.tsx
import { useQuery as useQuery8 } from "@tanstack/react-query";
var LOCALES_QUERY_KEY = "locales";
var localesQueryKeys = queryKeysFactory(LOCALES_QUERY_KEY);
var useLocales = (query, options) => {
  const { data, ...rest } = useQuery8({
    queryFn: () => sdk.admin.locale.list(query),
    queryKey: localesQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/notification.tsx
import { useQuery as useQuery9 } from "@tanstack/react-query";
var NOTIFICATION_QUERY_KEY = "notification";
var notificationQueryKeys = queryKeysFactory(NOTIFICATION_QUERY_KEY);
var useNotifications = (query, options) => {
  const { data, ...rest } = useQuery9({
    queryFn: () => sdk.admin.notification.list(query),
    queryKey: notificationQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/payment-collections.tsx
import { useMutation as useMutation7 } from "@tanstack/react-query";
var PAYMENT_COLLECTION_QUERY_KEY = "payment-collection";
var paymentCollectionQueryKeys = queryKeysFactory(
  PAYMENT_COLLECTION_QUERY_KEY
);
var useMarkPaymentCollectionAsPaid = (orderId, paymentCollectionId, options) => {
  return useMutation7({
    mutationFn: (payload) => sdk.admin.paymentCollection.markAsPaid(paymentCollectionId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details()
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId)
      });
      queryClient.invalidateQueries({
        queryKey: paymentCollectionQueryKeys.all
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

// src/hooks/api/payments.tsx
import {
  useMutation as useMutation8,
  useQuery as useQuery10
} from "@tanstack/react-query";
var PAYMENT_QUERY_KEY = "payment";
var paymentQueryKeys = queryKeysFactory(PAYMENT_QUERY_KEY);
var PAYMENT_PROVIDERS_QUERY_KEY = "payment_providers";
var paymentProvidersQueryKeys = queryKeysFactory(
  PAYMENT_PROVIDERS_QUERY_KEY
);
var useCapturePayment = (orderId, paymentId, options) => {
  return useMutation8({
    mutationFn: (payload) => sdk.admin.payment.capture(paymentId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details()
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId)
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useRefundPayment = (orderId, paymentId, options) => {
  return useMutation8({
    mutationFn: (payload) => sdk.admin.payment.refund(paymentId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details()
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId)
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export {
  useCloudAuthEnabled,
  useCreateCloudAuthUser,
  useLocales,
  notificationQueryKeys,
  useNotifications,
  useMarkPaymentCollectionAsPaid,
  useCapturePayment,
  useRefundPayment,
  usePlugins,
  productVariantQueryKeys,
  useVariants,
  refundReasonsQueryKeys,
  useRefundReasons,
  useRefundReason,
  useCreateRefundReason,
  useUpdateRefundReason,
  useDeleteRefundReasonLazy,
  shippingOptionTypesQueryKeys,
  useShippingOptionType,
  useShippingOptionTypes,
  useCreateShippingOptionType,
  useUpdateShippingOptionType,
  useDeleteShippingOptionType,
  productTagsQueryKeys,
  useProductTag,
  useProductTags,
  useCreateProductTag,
  useUpdateProductTag,
  useDeleteProductTag,
  useReferenceTranslations,
  useBatchTranslations,
  useTranslationSettings,
  useTranslationStatistics
};
