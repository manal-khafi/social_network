import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../hooks";
import { setAuth, setAuthError } from "../features/auth/authSlice";
import {
  completeSocialRedirect,
  socialAuthErrorMessage,
} from "../Components/Authentication/auth/socialAuth";

/**
 * Mobile Google / Facebook sign-in uses a redirect: when the provider sends the
 * user back, finish the sign-in exactly like the popup flow does on desktop.
 */
export function useSocialRedirectResult() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    completeSocialRedirect()
      .then((data) => {
        if (!data) return;
        dispatch(setAuth({ token: data.token, user: data.user ?? null }));
        toast.success(t("auth.loginSuccess"));
        navigate(data.user?.onboarding_done === false ? "/personalize" : "/home", { replace: true });
      })
      .catch((error) => {
        const msg = socialAuthErrorMessage(error, t, t("auth.socialLoginFailed"));
        if (!msg) return;
        toast.error(msg);
        dispatch(setAuthError(msg));
      });
    // once per page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
