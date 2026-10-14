import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { ArrowLeft, CircleCheck, Shield } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

  const handleNavigate = () => {
    navigate('/');
  };

  // Verify token on mount
  useEffect(() => {
    if (!token){
      toast.error(t("auth.tokenMissing"));
      handleNavigate();
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`/authentication/verify-reset-token/${token}`);
        const data = res.data;
        if (!data.success) {
          toast.error(t("auth.tokenInvalid"));
          handleNavigate();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || t("auth.serverError"));
        handleNavigate();
      }
    };

    verifyToken();
  }, [token, handleNavigate]);



  // Password strength calculation
  useEffect(() => {
    const password = formData.password;
    if (!password) return setPasswordStrength("weak");

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const count = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    setPasswordStrength(count >= 4 ? "strong" : count >= 2 ? "medium" : "weak");
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = { password: "", confirmPassword: "" };

    if (formData.password.length < 8) newErrors.password = t("auth.passwordTooShort");
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t("auth.passwordsDontMatch");

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!token) return toast.error(t("auth.tokenMissing"));

    setIsLoading(true);
    try {
      const res = await api.post("/authentication/reset-password", { token, newPassword: formData.password });
      const data = res.data;
      if (data.success) {
        toast.success(t("auth.resetSuccessToast"));
        setIsSuccess(true);
      } else {
        toast.error(data.message || t("errors.generic"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("auth.serverError"));
    }
    setIsLoading(false);
  };

  const getStrengthStyles = () => {
    switch (passwordStrength) {
      case "strong": return { width: "100%", color: "#226d68", label: t("auth.strengthStrong"), barColor: "bg-[#226d68]" };
      case "medium": return { width: "66%", color: "#d6955b", label: t("auth.strengthMedium"), barColor: "bg-[#d6955b]" };
      default: return { width: "33%", color: "#ef4444", label: t("auth.strengthWeak"), barColor: "bg-red-500" };
    }
  };
  const strengthStyles = getStrengthStyles();

  return (
    // Center container like LoginScreen
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card text-card-foreground border border-border p-8 rounded-xl shadow-md"
      >
        {/* Back button */}
        <button
          onClick={handleNavigate}
          className="flex items-center gap-2 text-[#226d68] dark:text-[#6fc0b8] hover:text-[#18534f] dark:hover:text-[#b8e4de] transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>{t("auth.backToLogin")}</span>
        </button>

        {/* Success State */}
        {isSuccess ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <CircleCheck size={80} className="text-[#226d68] dark:text-[#6fc0b8]" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                  className="absolute -top-2 -end-2"
                >
                  <Shield size={32} className="text-[#d6955b]" />
                </motion.div>
              </div>
            </motion.div>
            <h2 className="text-3xl mb-4 text-[#18534f] dark:text-[#9ad5ce]">{t("auth.resetSuccessTitle")}</h2>
            <p className="text-muted-foreground mb-8">{t("auth.resetSuccessBody")}<br />{t("auth.resetSuccessHint")}</p>
            <AuthButton variant="primary" onClick={handleNavigate}>{t("auth.continueToLogin")}</AuthButton>
          </div>
        ) : (
          <>
            {/* Form Header */}
            <div className="text-center mb-8">
              <motion.div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ecf8f6] dark:bg-muted mb-4">
                <Shield size={32} className="text-[#226d68] dark:text-[#6fc0b8]" />
              </motion.div>
              <h1 className="text-4xl mb-2 text-[#18534f] dark:text-[#9ad5ce]">{t("auth.resetPassword")}</h1>
              <p className="text-muted-foreground">{t("auth.resetPasswordSubtitle")}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthInput
                label={t("auth.newPassword")}
                type="password"
                placeholder={t("auth.newPasswordPlaceholder")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
              />

              {/* Password strength */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">{t("auth.passwordStrength")}</span>
                    <span className="text-sm font-medium" style={{ color: strengthStyles.color }}>
                      {strengthStyles.label}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${strengthStyles.barColor} rounded-full`} style={{ width: strengthStyles.width }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("auth.passwordHint")}
                  </p>
                </div>
              )}

              <AuthInput
                label={t("auth.confirmPassword")}
                type="password"
                placeholder={t("auth.confirmNewPasswordPlaceholder")}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
              />

              <AuthButton variant="primary" isLoading={isLoading} type="submit">
                {t("auth.resetPassword")}
              </AuthButton>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
