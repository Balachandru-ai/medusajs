import {
  AvatarBox
} from "./chunk-O333RR6K.mjs";
import "./chunk-KIIT4BNH.mjs";
import {
  isFetchError
} from "./chunk-ONB3JEHR.mjs";
import {
  useExtension
} from "./chunk-C5P5PL3E.mjs";
import {
  Form
} from "./chunk-OBQI23QM.mjs";
import {
  useCloudAuthEnabled,
  useCreateCloudAuthUser
} from "./chunk-EBARGQLA.mjs";
import {
  useSignInWithEmailPass
} from "./chunk-I4OBEAOJ.mjs";
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
import {
  sdk
} from "./chunk-NFEK63OE.mjs";
import "./chunk-QZ7TP4HQ.mjs";

// src/routes/login/login.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button as Button2, Heading, Hint, Input, Text } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { Trans, useTranslation as useTranslation2 } from "react-i18next";
import { Link, useLocation, useNavigate as useNavigate2 } from "react-router-dom";
import * as z from "zod";

// src/routes/login/components/cloud-auth-login.tsx
import { Button, toast } from "@medusajs/ui";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { decodeToken } from "react-jwt";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var CLOUD_AUTH_PROVIDER = "cloud";
var CloudAuthLogin = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { handleCallback, isCallbackPending } = useAuthCallback(searchParams);
  const hasCallbackParams = searchParams.get("auth_provider") === CLOUD_AUTH_PROVIDER && searchParams.has("code") && searchParams.has("state");
  const callbackInitiated = useRef(false);
  useEffect(() => {
    if (hasCallbackParams && !callbackInitiated.current) {
      callbackInitiated.current = true;
      handleCallback();
    }
  }, [hasCallbackParams, handleCallback]);
  const handleCloudLogin = async () => {
    try {
      const result = await sdk.auth.login("user", CLOUD_AUTH_PROVIDER, {
        // in case the admin is on a different domain, or the backend URL is set to just "/" which won't work for the callback
        callback_url: `${window.location.origin}${window.location.pathname}?auth_provider=${CLOUD_AUTH_PROVIDER}`
      });
      if (typeof result === "object" && result.location) {
        window.location.href = result.location;
        return;
      }
      throw new Error("Unexpected login response");
    } catch {
      toast.error(t("auth.login.authenticationFailed"));
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("hr", { className: "bg-ui-border-base my-4" }),
    /* @__PURE__ */ jsx(
      Button,
      {
        variant: "secondary",
        onClick: handleCloudLogin,
        className: "w-full",
        disabled: isCallbackPending,
        isLoading: isCallbackPending,
        children: t("auth.login.cloud")
      }
    )
  ] });
};
var useAuthCallback = (searchParams) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: createCloudAuthUser } = useCreateCloudAuthUser();
  const { mutateAsync: handleCallback, isPending: isCallbackPending } = useMutation({
    mutationFn: async () => {
      let token;
      try {
        const query = Object.fromEntries(searchParams);
        delete query.auth_provider;
        token = await sdk.auth.callback("user", CLOUD_AUTH_PROVIDER, query);
      } catch (error) {
        throw new Error("Authentication callback failed");
      }
      const decodedToken = decodeToken(token);
      if (!decodedToken?.actor_id) {
        await createCloudAuthUser();
        const refreshedToken = await sdk.auth.refresh({
          Authorization: `Bearer ${token}`
          // passing it manually in case the auth type is session
        });
        if (!refreshedToken) {
          throw new Error("Failed to refresh token after user creation");
        }
      }
      return true;
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: () => {
      toast.error(t("auth.login.authenticationFailed"));
    }
  });
  return { handleCallback, isCallbackPending };
};

// src/routes/login/login.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
var Login = () => {
  const { t } = useTranslation2();
  const location = useLocation();
  const navigate = useNavigate2();
  const { getWidgets } = useExtension();
  const { data: cloudAuth } = useCloudAuthEnabled();
  const from = location.state?.from?.pathname || "/orders";
  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const { mutateAsync, isPending } = useSignInWithEmailPass();
  const handleSubmit = form.handleSubmit(async ({ email, password }) => {
    await mutateAsync(
      {
        email,
        password
      },
      {
        onError: (error) => {
          if (isFetchError(error)) {
            if (error.status === 401) {
              form.setError("email", {
                type: "manual",
                message: error.message
              });
              return;
            }
          }
          form.setError("root.serverError", {
            type: "manual",
            message: error.message
          });
        },
        onSuccess: () => {
          navigate(from, { replace: true });
        }
      }
    );
  });
  const serverError = form.formState.errors?.root?.serverError?.message;
  const validationError = form.formState.errors.email?.message || form.formState.errors.password?.message;
  const loginAfterWidgets = [...getWidgets("login.after")];
  if (cloudAuth?.enabled) {
    loginAfterWidgets.push(CloudAuthLogin);
  }
  return /* @__PURE__ */ jsx2("div", { className: "bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center", children: /* @__PURE__ */ jsxs2("div", { className: "m-4 flex w-full max-w-[280px] flex-col items-center", children: [
    /* @__PURE__ */ jsx2(AvatarBox, {}),
    /* @__PURE__ */ jsxs2("div", { className: "mb-4 flex flex-col items-center", children: [
      /* @__PURE__ */ jsx2(Heading, { children: t("login.title") }),
      /* @__PURE__ */ jsx2(Text, { size: "small", className: "text-ui-fg-subtle text-center", children: t("login.hint") })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex w-full flex-col gap-y-3", children: [
      getWidgets("login.before").map((Component, i) => {
        return /* @__PURE__ */ jsx2(Component, {}, i);
      }),
      /* @__PURE__ */ jsx2(Form, { ...form, children: /* @__PURE__ */ jsxs2(
        "form",
        {
          onSubmit: handleSubmit,
          className: "flex w-full flex-col gap-y-6",
          children: [
            /* @__PURE__ */ jsxs2("div", { className: "flex flex-col gap-y-1", children: [
              /* @__PURE__ */ jsx2(
                Form.Field,
                {
                  control: form.control,
                  name: "email",
                  render: ({ field }) => {
                    return /* @__PURE__ */ jsx2(Form.Item, { children: /* @__PURE__ */ jsx2(Form.Control, { children: /* @__PURE__ */ jsx2(
                      Input,
                      {
                        autoComplete: "email",
                        ...field,
                        className: "bg-ui-bg-field-component",
                        placeholder: t("fields.email")
                      }
                    ) }) });
                  }
                }
              ),
              /* @__PURE__ */ jsx2(
                Form.Field,
                {
                  control: form.control,
                  name: "password",
                  render: ({ field }) => {
                    return /* @__PURE__ */ jsxs2(Form.Item, { children: [
                      /* @__PURE__ */ jsx2(Form.Label, {}),
                      /* @__PURE__ */ jsx2(Form.Control, { children: /* @__PURE__ */ jsx2(
                        Input,
                        {
                          type: "password",
                          autoComplete: "current-password",
                          ...field,
                          className: "bg-ui-bg-field-component",
                          placeholder: t("fields.password")
                        }
                      ) })
                    ] });
                  }
                }
              )
            ] }),
            validationError && /* @__PURE__ */ jsx2("div", { className: "text-center", children: /* @__PURE__ */ jsx2(Hint, { className: "inline-flex", variant: "error", children: validationError }) }),
            serverError && /* @__PURE__ */ jsx2(
              Alert,
              {
                className: "bg-ui-bg-base items-center p-2",
                dismissible: true,
                variant: "error",
                children: serverError
              }
            ),
            /* @__PURE__ */ jsx2(Button2, { className: "w-full", type: "submit", isLoading: isPending, children: t("actions.continueWithEmail") })
          ]
        }
      ) }),
      loginAfterWidgets.map((Component, i) => {
        return /* @__PURE__ */ jsx2(Component, {}, i);
      })
    ] }),
    /* @__PURE__ */ jsx2("span", { className: "text-ui-fg-muted txt-small my-6", children: /* @__PURE__ */ jsx2(
      Trans,
      {
        i18nKey: "login.forgotPassword",
        components: [
          /* @__PURE__ */ jsx2(
            Link,
            {
              to: "/reset-password",
              className: "text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
            },
            "reset-password-link"
          )
        ]
      }
    ) })
  ] }) });
};
export {
  Login as Component
};
