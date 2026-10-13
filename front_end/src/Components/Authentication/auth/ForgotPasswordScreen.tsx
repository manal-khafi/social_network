import React, { useState } from "react";
import { motion } from "framer-motion";
import api from "../../../api/axios";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ForgotPasswordScreenProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onSwitchToLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/authentication/forgot-password", { email });
      const data = response.data;

      if (data.success) {
        toast.success(data.message);
        setIsSuccess(true);
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || t("auth.serverError");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-6"
          >
            <CircleCheck size={80} className="text-[#226d68]" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl mb-4 text-[#18534f]"
          >
            {t("auth.checkYourEmail")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            {t("auth.resetLinkSent")} <br />
            <span className="text-[#18534f]">{email}</span>
          </motion.p>

          <AuthButton variant="secondary" onClick={onSwitchToLogin}>
            {t("auth.backToLogin")}
          </AuthButton>
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
      <button
        onClick={onSwitchToLogin}
        className="flex items-center gap-2 text-[#226d68] hover:text-[#18534f] transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span>{t("auth.backToLogin")}</span>
      </button>

      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl mb-2 text-[#18534f]"
        >
          {t("auth.forgotPasswordTitle")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600"
        >
          {t("auth.forgotPasswordSubtitle")}
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label={t("auth.email")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <AuthButton variant="primary" isLoading={isLoading} type="submit">
          {t("auth.sendResetLink")}
        </AuthButton>
      </form>
    </motion.div>
  );
};
