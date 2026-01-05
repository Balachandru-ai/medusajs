import {
  IconAvatar
} from "./chunk-KIIT4BNH.mjs";
import {
  TwoColumnPage
} from "./chunk-GIZFNLKK.mjs";
import {
  TwoColumnPageSkeleton
} from "./chunk-LPEUYMRK.mjs";
import {
  useTranslationSettings,
  useTranslationStatistics
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

// src/routes/translations/translation-list/translation-list.tsx
import { Container as Container4, Heading as Heading3, Text as Text4 } from "@medusajs/ui";
import { useTranslation as useTranslation4 } from "react-i18next";

// src/routes/translations/translation-list/components/active-locales-section/active-locales-section.tsx
import { PencilSquare, Language } from "@medusajs/icons";
import {
  Container,
  Heading,
  IconButton,
  InlineTip,
  Text,
  Tooltip
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsx, jsxs } from "react/jsx-runtime";
var ActiveLocalesSection = ({
  locales
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const handleManageLocales = useCallback(() => {
    navigate("/settings/translations/add-locales");
  }, [navigate]);
  const renderLocales = useCallback(() => {
    const maxLocalesToDetail = 2;
    if (locales.length <= maxLocalesToDetail) {
      return locales.map((locale) => locale.name).join(", ");
    }
    return `${locales.slice(0, maxLocalesToDetail).map((locale) => locale.name).join(", ")} + ${locales.length - maxLocalesToDetail}`;
  }, [locales]);
  const hasLocales = locales.length > 0;
  return /* @__PURE__ */ jsxs(Container, { className: "flex flex-col p-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
      /* @__PURE__ */ jsx(Heading, { level: "h2", children: t("translations.activeLocales.heading") }),
      /* @__PURE__ */ jsx(IconButton, { variant: "transparent", onClick: handleManageLocales, children: /* @__PURE__ */ jsx(PencilSquare, {}) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-1 pb-1", children: hasLocales ? /* @__PURE__ */ jsx(
      Tooltip,
      {
        open: isHovered,
        content: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-y-1 p-1", children: locales.map((locale) => /* @__PURE__ */ jsx(Text, { size: "small", weight: "plus", children: locale.name }, locale.code)) }),
        children: /* @__PURE__ */ jsxs(
          Container,
          {
            className: "bg-ui-bg-component border-r-1 flex items-center gap-x-4 px-[19px] py-2",
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
            children: [
              /* @__PURE__ */ jsx(IconAvatar, { className: "border-ui-border-base border", children: /* @__PURE__ */ jsx(Language, {}) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx(Text, { size: "small", weight: "plus", children: t("translations.activeLocales.subtitle") }),
                /* @__PURE__ */ jsx(Text, { className: "text-ui-fg-subtle", size: "small", children: renderLocales() })
              ] })
            ]
          }
        )
      }
    ) : /* @__PURE__ */ jsx(InlineTip, { label: "Tip", children: t("translations.activeLocales.noLocalesTip") }) })
  ] });
};

// src/routes/translations/translation-list/components/translation-list-section/translation-list-section.tsx
import { Button, Container as Container2, Text as Text2 } from "@medusajs/ui";
import { Link } from "react-router-dom";
import { useTranslation as useTranslation2 } from "react-i18next";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var TranslationListSection = ({
  entities,
  hasLocales = false
}) => {
  const { t } = useTranslation2();
  return /* @__PURE__ */ jsx2(Container2, { className: "divide-y p-0", children: entities.map((entity) => /* @__PURE__ */ jsxs2(
    "div",
    {
      className: "grid grid-cols-[250px_1fr_auto] items-center gap-x-4 px-6 py-4",
      children: [
        /* @__PURE__ */ jsx2(Text2, { size: "small", weight: "plus", children: entity.label }),
        /* @__PURE__ */ jsx2(Text2, { size: "small", className: "text-ui-fg-subtle", children: t("translations.list.metrics", {
          translated: (entity.translatedCount ?? 0).toLocaleString(),
          total: (entity.totalCount ?? 0).toLocaleString()
        }) }),
        /* @__PURE__ */ jsx2(
          Link,
          {
            to: `/settings/translations/edit?reference=${entity.reference}`,
            children: /* @__PURE__ */ jsx2(
              Button,
              {
                variant: "secondary",
                size: "small",
                disabled: !hasLocales || !entity.totalCount,
                children: "Edit"
              }
            )
          }
        )
      ]
    },
    entity.reference
  )) });
};

// src/routes/translations/translation-list/components/translations-completion-section/translations-completion-section.tsx
import { Container as Container3, Divider, Heading as Heading2, Text as Text3, Tooltip as Tooltip2 } from "@medusajs/ui";
import { useMemo, useState as useState2 } from "react";
import { useTranslation as useTranslation3 } from "react-i18next";
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var TranslationsCompletionSection = ({
  statistics,
  locales
}) => {
  const { t } = useTranslation3();
  const [hoveredLocale, setHoveredLocale] = useState2(null);
  const { translatedCount, totalCount } = Object.values(statistics).reduce(
    (acc, curr) => ({
      translatedCount: acc.translatedCount + curr.translated,
      totalCount: acc.totalCount + curr.expected
    }),
    { totalCount: 0, translatedCount: 0 }
  );
  const percentage = totalCount > 0 ? translatedCount / totalCount * 100 : 0;
  const remaining = Math.max(0, totalCount - translatedCount);
  const localeStats = useMemo(() => {
    const localeMap = /* @__PURE__ */ new Map();
    locales.forEach((locale) => {
      localeMap.set(locale.code, { translated: 0, expected: 0 });
    });
    Object.values(statistics).forEach((entityStats) => {
      if (entityStats.by_locale) {
        Object.entries(entityStats.by_locale).forEach(
          ([localeCode, localeData]) => {
            const existing = localeMap.get(localeCode);
            if (existing) {
              existing.translated += localeData.translated;
              existing.expected += localeData.expected;
            }
          }
        );
      }
    });
    return locales.map((locale) => {
      const stats = localeMap.get(locale.code) || { translated: 0, expected: 0 };
      return {
        code: locale.code,
        name: locale.name,
        translated: stats.translated,
        toTranslate: Math.max(0, stats.expected - stats.translated),
        total: stats.expected
      };
    });
  }, [statistics, locales]);
  const maxTotal = useMemo(
    () => Math.max(...localeStats.map((s) => s.total), 1),
    [localeStats]
  );
  const localeStatsCount = useMemo(() => localeStats.length, [localeStats]);
  return /* @__PURE__ */ jsxs3(Container3, { className: "p-0", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-y-4 px-6 py-4", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx3(Heading2, { level: "h2", children: t("translations.completion.heading") }),
        /* @__PURE__ */ jsxs3(Text3, { size: "small", weight: "plus", className: "text-ui-fg-subtle", children: [
          translatedCount.toLocaleString(),
          " ",
          t("general.of"),
          " ",
          totalCount.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsx3("div", { className: "flex h-3 w-full overflow-hidden", children: percentage > 0 ? /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx3(
          "div",
          {
            className: "mr-0.5 h-full rounded-sm transition-all",
            style: {
              width: `${percentage}%`,
              backgroundColor: "var(--tag-blue-icon)",
              boxShadow: "inset 0 0 0 0.5px var(--alpha-250)"
            }
          }
        ),
        /* @__PURE__ */ jsx3(
          "div",
          {
            className: "h-full flex-1 rounded-sm",
            style: {
              backgroundColor: "var(--tag-blue-border)",
              boxShadow: "inset 0 0 0 0.5px var(--alpha-250)"
            }
          }
        )
      ] }) : /* @__PURE__ */ jsx3(
        "div",
        {
          className: "h-full w-full rounded-sm",
          style: {
            backgroundColor: "var(--tag-blue-border)",
            boxShadow: "inset 0 0 0 0.5px var(--alpha-250)"
          }
        }
      ) }),
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs3(Text3, { size: "small", weight: "plus", className: "text-ui-fg-subtle", children: [
          percentage.toFixed(1),
          "%"
        ] }),
        /* @__PURE__ */ jsxs3(Text3, { size: "small", weight: "plus", className: "text-ui-fg-subtle", children: [
          remaining.toLocaleString(),
          " ",
          t("general.remaining").toLowerCase()
        ] })
      ] })
    ] }),
    localeStats.length > 0 && /* @__PURE__ */ jsxs3(Fragment, { children: [
      /* @__PURE__ */ jsx3(Divider, { variant: "dashed" }),
      /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-y-3 px-6 pb-6 pt-4", children: [
        /* @__PURE__ */ jsx3("div", { className: "flex h-32 w-full items-end gap-1", children: localeStats.map((locale) => {
          const heightPercent = locale.total / maxTotal * 100;
          const translatedPercent = locale.total > 0 ? locale.translated / locale.total * 100 : 0;
          return /* @__PURE__ */ jsx3(
            Tooltip2,
            {
              open: hoveredLocale === locale.code,
              content: /* @__PURE__ */ jsxs3("div", { className: "flex min-w-[150px] flex-col gap-y-1 p-1", children: [
                /* @__PURE__ */ jsx3(Text3, { size: "small", weight: "plus", children: locale.name }),
                /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-x-2", children: [
                    /* @__PURE__ */ jsx3(
                      "div",
                      {
                        className: "h-2 w-2 rounded-full",
                        style: {
                          backgroundColor: "var(--tag-blue-icon)",
                          boxShadow: "inset 0 0 0 0.5px var(--alpha-250)"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx3(
                      Text3,
                      {
                        size: "small",
                        weight: "plus",
                        className: "text-ui-fg-base",
                        children: t("translations.completion.translated")
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx3(
                    Text3,
                    {
                      size: "small",
                      weight: "plus",
                      className: "text-ui-fg-base",
                      children: locale.translated
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-x-2", children: [
                    /* @__PURE__ */ jsx3(
                      "div",
                      {
                        className: "h-2 w-2 rounded-full",
                        style: {
                          backgroundColor: "var(--tag-blue-border)",
                          boxShadow: "inset 0 0 0 0.5px var(--alpha-250)"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx3(
                      Text3,
                      {
                        size: "small",
                        weight: "plus",
                        className: "text-ui-fg-base",
                        children: t("translations.completion.toTranslate")
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx3(
                    Text3,
                    {
                      size: "small",
                      weight: "plus",
                      className: "text-ui-fg-base",
                      children: locale.toTranslate
                    }
                  )
                ] })
              ] }),
              children: /* @__PURE__ */ jsx3("div", { className: "flex h-full flex-1 items-end justify-center", children: /* @__PURE__ */ jsx3(
                "div",
                {
                  className: "flex w-full min-w-2 max-w-[96px] flex-col justify-end overflow-hidden rounded-t-sm transition-opacity",
                  style: { height: `${heightPercent}%` },
                  onMouseEnter: () => setHoveredLocale(locale.code),
                  onMouseLeave: () => setHoveredLocale(null),
                  children: translatedPercent === 0 ? /* @__PURE__ */ jsx3(
                    "div",
                    {
                      className: "w-full rounded-sm",
                      style: {
                        height: "100%",
                        backgroundColor: "var(--tag-neutral-bg)",
                        boxShadow: "inset 0 0 0 0.5px var(--alpha-250)"
                      }
                    }
                  ) : /* @__PURE__ */ jsxs3(Fragment, { children: [
                    /* @__PURE__ */ jsx3(
                      "div",
                      {
                        className: "w-full rounded-sm",
                        style: {
                          height: `${100 - translatedPercent}%`,
                          backgroundColor: "var(--tag-blue-border)",
                          boxShadow: "inset 0 0 0 0.5px var(--alpha-250)",
                          minHeight: locale.toTranslate > 0 ? "2px" : "0"
                        }
                      }
                    ),
                    translatedPercent > 0 && /* @__PURE__ */ jsx3(
                      "div",
                      {
                        className: "mt-0.5 w-full rounded-sm",
                        style: {
                          height: `${translatedPercent}%`,
                          backgroundColor: "var(--tag-blue-icon)",
                          boxShadow: "inset 0 0 0 0.5px var(--alpha-250)",
                          minHeight: locale.translated > 0 ? "2px" : "0"
                        }
                      }
                    )
                  ] })
                }
              ) })
            },
            locale.code
          );
        }) }),
        localeStatsCount < 9 && /* @__PURE__ */ jsx3("div", { className: "flex w-full gap-1", children: localeStats.map((locale) => /* @__PURE__ */ jsx3(
          "div",
          {
            className: "flex flex-1 items-center justify-center",
            children: /* @__PURE__ */ jsx3(
              Text3,
              {
                size: "xsmall",
                weight: "plus",
                className: "text-ui-fg-subtle min-w-2 whitespace-normal break-words text-center leading-tight",
                children: localeStatsCount < 6 ? locale.name : locale.code
              }
            )
          },
          locale.code
        )) }),
        localeStatsCount > 9 && /* @__PURE__ */ jsx3(
          Text3,
          {
            weight: "plus",
            size: "xsmall",
            className: "text-ui-fg-subtle text-center",
            children: t("translations.completion.footer")
          }
        )
      ] })
    ] })
  ] });
};

// src/routes/translations/translation-list/translation-list.tsx
import { useMemo as useMemo2 } from "react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var TranslationList = () => {
  const { t } = useTranslation4();
  const { store, isPending, isError, error } = useStore();
  const {
    translatable_fields,
    isPending: isTranslationSettingsPending,
    isError: isTranslationSettingsError,
    error: translationSettingsError
  } = useTranslationSettings();
  const {
    statistics,
    isPending: isTranslationStatisticsPending,
    isError: isTranslationStatisticsError,
    error: translationStatisticsError
  } = useTranslationStatistics(
    {
      locales: store?.supported_locales?.map(
        (suportedLocale) => suportedLocale.locale_code
      ) ?? [],
      entity_types: Object.keys(translatable_fields ?? {})
    },
    {
      enabled: !!translatable_fields && !!store && store.supported_locales?.length > 0
    }
  );
  if (isError || isTranslationSettingsError || isTranslationStatisticsError) {
    throw error || translationSettingsError || translationStatisticsError;
  }
  const hasLocales = (store?.supported_locales ?? []).length > 0;
  const translatableEntities = useMemo2(() => {
    if (!translatable_fields) {
      return [];
    }
    return Object.entries(translatable_fields).filter(
      ([entity]) => !["product_option", "product_option_value"].includes(entity)
    ).map(([entity, fields]) => {
      const entityStatistics = statistics?.[entity] ?? {
        translated: 0,
        expected: 0
      };
      return {
        label: entity.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
        reference: entity,
        translatableFields: fields,
        translatedCount: entityStatistics.translated,
        totalCount: entityStatistics.expected
      };
    });
  }, [translatable_fields, statistics]);
  const isReady = !!store && !isPending && !isTranslationSettingsPending && !!translatable_fields && (!!statistics && !isTranslationStatisticsPending || !hasLocales);
  if (!isReady) {
    return /* @__PURE__ */ jsx4(TwoColumnPageSkeleton, { sidebarSections: 2 });
  }
  return /* @__PURE__ */ jsxs4(
    TwoColumnPage,
    {
      widgets: {
        before: [],
        after: [],
        sideBefore: [],
        sideAfter: []
      },
      children: [
        /* @__PURE__ */ jsxs4(TwoColumnPage.Main, { children: [
          /* @__PURE__ */ jsxs4(Container4, { className: "flex flex-col px-6 py-4", children: [
            /* @__PURE__ */ jsxs4(Heading3, { children: [
              "Manage ",
              t("translations.domain")
            ] }),
            /* @__PURE__ */ jsx4(Text4, { className: "text-ui-fg-subtle", size: "small", children: t("translations.subtitle") })
          ] }),
          /* @__PURE__ */ jsx4(
            TranslationListSection,
            {
              entities: translatableEntities,
              hasLocales
            }
          )
        ] }),
        /* @__PURE__ */ jsxs4(TwoColumnPage.Sidebar, { children: [
          /* @__PURE__ */ jsx4(
            ActiveLocalesSection,
            {
              locales: store?.supported_locales?.map(
                (suportedLocale) => suportedLocale.locale
              ) ?? []
            }
          ),
          /* @__PURE__ */ jsx4(
            TranslationsCompletionSection,
            {
              statistics: statistics ?? {},
              locales: store?.supported_locales?.map(
                (supportedLocale) => supportedLocale.locale
              ) ?? []
            }
          )
        ] })
      ]
    }
  );
};
export {
  TranslationList as Component
};
