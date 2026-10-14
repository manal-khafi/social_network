import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../hooks";
import {
  setAuth,
  setAuthError,
  setAuthLoading,
} from "../../../features/auth/authSlice";
import api from "../../../api/axios";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { SocialButton } from "./SocialButton";
import {
  oauthErrorMessage,
  peekOAuthError,
  startSocialAuth,
  takeOAuthError,
  type SocialProvider,
} from "./socialAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Logo } from "./Logo";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  // Set when the backend answers the password step with a 2FA challenge.
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const goNextAfterAuth = (_user?: any, redirectTo?: string) => {
    if (redirectTo && redirectTo !== "/personalize") {
      navigate(redirectTo);
      return;
    }
    navigate("/home");
  };

  // Signing into a deactivated account: ask before reactivating it. "password"
  // re-sends the form with reactivate: true; a provider restarts its sign-in.
  const [reactivation, setReactivation] = useState<"password" | SocialProvider | null>(() => {
    const error = peekOAuthError();
    return error?.code === "account_deactivated" ? error.provider : null;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(false);
  };

  const confirmReactivation = () => {
    const how = reactivation;
    setReactivation(null);
    if (how === "password") signIn(true);
    else if (how) {
      setIsLoading(true);
      startSocialAuth(how, { reactivate: true });
    }
  };

  const signIn = async (reactivate: boolean) => {
    setIsLoading(true);
    dispatch(setAuthLoading());

    try {
      const response = await api.post("/authentication/login", {
        email: formData.emailOrUsername,
        password: formData.password,
        ...(reactivate && { reactivate: true }),
      });

      const data = response.data;

      if (!data?.success) {
        const msg = data?.message || t("auth.loginFailed");
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      // Account protected by 2FA: no token yet, ask for the authenticator code.
      if (data.requiresTwoFactor && data.twoFactorToken) {
        setTwoFactorToken(data.twoFactorToken);
        setTwoFactorCode("");
        return;
      }

      if (!data.token) {
        const msg = t("auth.missingToken");
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      toast.success(data.message || t("auth.loginSuccess"));

      // ✅ Store BACKEND JWT only. Firebase user is not involved in password login.
      dispatch(setAuth({ token: data.token, user: data.user ?? null }));

      goNextAfterAuth(data.user, data.redirectTo);
      if (reactivate) toast.success(t("auth.accountReactivated"));
    } catch (error: any) {
      if (error.response?.data?.code === "account_deactivated") {
        dispatch(setAuthError(""));
        setReactivation("password");
        return;
      }
      const errorMsg =
        error.response?.data?.message || t("auth.serverError");
      toast.error(errorMsg);
      dispatch(setAuthError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTwoFactor = () => {
    setTwoFactorToken(null);
    setTwoFactorCode("");
    setFormData((prev) => ({ ...prev, password: "" }));
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    dispatch(setAuthLoading());

    try {
      const response = await api.post("/auth/2fa/verify-login", {
        twoFactorToken,
        code: twoFactorCode,
      });

      const data = response.data;

      if (!data?.success || !data.token) {
        const msg = data?.message || t("auth.loginFailed");
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      toast.success(data.message || t("auth.loginSuccess"));
      dispatch(setAuth({ token: data.token, user: data.user ?? null }));
      goNextAfterAuth(data.user, data.redirectTo);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || t("auth.serverError");
      toast.error(errorMsg);
      dispatch(setAuthError(errorMsg));
      setTwoFactorCode("");
      // Challenge expired or no longer valid: back to the password step.
      if (error.response?.status === 401) cancelTwoFactor();
    } finally {
      setIsLoading(false);
    }
  };

  // Full-page redirect; the backend brings the browser back signed in.
  const onSocialAuth = (provider: SocialProvider) => {
    setIsLoading(true);
    startSocialAuth(provider);
  };

  // Back from a failed Google sign-in.
  useEffect(() => {
    const error = takeOAuthError();
    const msg = error && oauthErrorMessage(error.code, t);
    if (msg) toast.error(msg);
  }, [t]);

  if (twoFactorToken) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo />
          <p className="text-muted-foreground">
            {t("auth.twoFactorPrompt")}
          </p>
        </div>

        <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
          <AuthInput
            label={t("auth.twoFactorCode")}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            value={twoFactorCode}
            onChange={(e) =>
              setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            autoFocus
            required
          />

          <AuthButton variant="primary" isLoading={isLoading} type="submit">
            {t("auth.verify")}
          </AuthButton>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={cancelTwoFactor}
            className="text-sm text-[#226d68] dark:text-[#6fc0b8] hover:text-[#18534f] dark:hover:text-[#b8e4de] transition-colors"
            type="button"
          >
            {t("auth.backToLogin")}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <Logo />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground"
        >
          {t("auth.welcomeBack")}
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label={t("auth.emailOrUsername")}
          type="text"
          placeholder={t("auth.emailOrUsernamePlaceholder")}
          value={formData.emailOrUsername}
          onChange={(e) =>
            setFormData({ ...formData, emailOrUsername: e.target.value })
          }
          required
        />

        <AuthInput
          label={t("auth.password")}
          type="password"
          placeholder={t("auth.passwordPlaceholder")}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-[#226d68] dark:text-[#6fc0b8] hover:text-[#18534f] dark:hover:text-[#b8e4de] transition-colors"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>

        <AuthButton variant="primary" isLoading={isLoading} type="submit">
          {t("auth.login")}
        </AuthButton>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">{t("auth.or")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="space-y-3">
        <SocialButton provider="google" onClick={() => onSocialAuth("google")} />
      </div>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-[#d6955b] hover:text-[#c8864d] transition-colors"
            type="button"
          >
            {t("auth.signUp")}
          </button>
        </p>
      </div>
      <AlertDialog open={reactivation !== null} onOpenChange={(open) => !open && setReactivation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.accountDeactivatedTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("auth.accountDeactivatedReactivate")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReactivation}>{t("auth.reactivateAccount")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
