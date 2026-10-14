import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../hooks";
import { setAuth, setAuthError, setAuthLoading } from "../../../features/auth/authSlice";
import api from "../../../api/axios";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { SocialButton } from "./SocialButton";
import { oauthErrorMessage, startSocialAuth, takeOAuthError, type SocialProvider } from "./socialAuth";
import { Logo } from "./Logo";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    date_of_birth: "",
    account_name: "",
    adresse: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.password.length < 8) {
      newErrors.password = t("auth.passwordTooShort");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.passwordsDontMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNextAfterAuth = (user?: any) => {
    if (user?.onboarding_done === false) {
      navigate("/personalize");
    } else {
      navigate("/home");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    dispatch(setAuthLoading());

    try {
      const response = await api.post("/authentication", formData);
      const data = response.data;

      if (!data?.success) {
        const msg = data?.message || t("auth.registrationFailed");
        toast.error(msg);
        dispatch(setAuthError(msg));
        return;
      }

      toast.success(
        data.message || t("auth.registrationSuccess")
      );

      // Registration flow: you may require email verification then login
      onSwitchToLogin();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || t("auth.serverError");
      toast.error(errorMsg);
      dispatch(setAuthError(errorMsg));
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Full-page redirect; the backend brings the browser back signed in.
  const onSocialAuth = (provider: SocialProvider) => {
    setIsLoading(true);
    startSocialAuth(provider);
  };

  // Back from a failed Google / Facebook sign-in.
  useEffect(() => {
    const code = takeOAuthError();
    const msg = code && oauthErrorMessage(code, t);
    if (msg) toast.error(msg);
  }, [t]);

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
          className="text-gray-600"
        >
          {t("auth.joinCommunity")}
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label={t("auth.usernameUnique")}
          type="text"
          placeholder={t("auth.usernamePlaceholder")}
          value={formData.username}
          onChange={(e) =>
            setFormData({
              ...formData,
              username: e.target.value.replace(/\s/g, ""),
            })
          }
          required
        />

        <AuthInput
          label={t("auth.fullName")}
          type="text"
          placeholder={t("auth.fullNamePlaceholder")}
          value={formData.display_name}
          onChange={(e) =>
            setFormData({ ...formData, display_name: e.target.value })
          }
          required
        />

        <AuthInput
          label={t("auth.email")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <AuthInput
          label={t("auth.password")}
          type="password"
          placeholder={t("auth.createPasswordPlaceholder")}
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: "" });
          }}
          error={errors.password}
          required
        />

        <AuthInput
          label={t("auth.confirmPassword")}
          type="password"
          placeholder={t("auth.confirmPasswordPlaceholder")}
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) {
              setErrors({ ...errors, confirmPassword: "" });
            }
          }}
          error={errors.confirmPassword}
          required
        />

        <AuthInput
          label={t("auth.address")}
          type="text"
          placeholder={t("auth.addressPlaceholder")}
          value={formData.adresse}
          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          required
        />

        <AuthInput
          label={t("auth.dateOfBirth")}
          type="date"
          placeholder={t("auth.dateOfBirthPlaceholder")}
          value={formData.date_of_birth}
          onChange={(e) =>
            setFormData({ ...formData, date_of_birth: e.target.value })
          }
          required
        />

        <AuthButton variant="primary" isLoading={isLoading} type="submit">
          {t("auth.register")}
        </AuthButton>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">{t("auth.or")}</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <div className="space-y-3">
        <SocialButton provider="google" onClick={() => onSocialAuth("google")} />
        <SocialButton provider="facebook" onClick={() => onSocialAuth("facebook")} />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {t("auth.haveAccount")}{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-[#d6955b] hover:text-[#c8864d] transition-colors"
            type="button"
          >
            {t("auth.login")}
          </button>
        </p>
      </div>
    </motion.div>
  );
};
