import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { ArrowLeft, CircleCheck, Shield } from "lucide-react";

interface ResetPasswordScreenProps {
  onSwitchToLogin: () => void;
}

type PasswordStrength = "weak" | "medium" | "strong";

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onSwitchToLogin,
}) => {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>("weak");

  // Verify token on mount
  useEffect(() => {
    if (!token){
      console.error("No token found in URL");
      alert("Token missing or invalid");
      onSwitchToLogin();
      return;
    }

    const verifyToken = async () => {
      try {
        console.log(token);
        
        const res = await fetch(`http://localhost:3500/api/authentification/verify-reset-token/${token}`);

        if (!res.ok) {
          console.log("Token verification failed");
          console.error("Server responded with:", res.status, res.statusText);
          // alert("Token invalide ou expiré ou serveur indisponible");
          console.log("Token invalide ou expiré ou serveur indisponible");
          setTimeout(() => onSwitchToLogin(), 20000);
          
          return;
        }

        const data = await res.json();
        if (!data.success) {
          alert("Token invalide ou expiré");
          onSwitchToLogin();
        }
      } catch (err) {
        console.error("Failed to verify token", err);
        alert("Erreur serveur. Vérifiez que le backend est en cours d'exécution sur le port 3500.");
        onSwitchToLogin();
      }
    };

    verifyToken();
  }, [token, onSwitchToLogin]);


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

    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!token) return alert("Token missing or invalid");

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3500/api/authentification/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: formData.password }),
      });
      const data = await res.json();
      if (data.success) setIsSuccess(true);
      else alert(data.message || "Something went wrong");
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
    setIsLoading(false);
  };

  const getStrengthStyles = () => {
    switch (passwordStrength) {
      case "strong": return { width: "100%", color: "#226d68", label: "Strong", barColor: "bg-[#226d68]" };
      case "medium": return { width: "66%", color: "#d6955b", label: "Medium", barColor: "bg-[#d6955b]" };
      default: return { width: "33%", color: "#ef4444", label: "Weak", barColor: "bg-red-500" };
    }
  };
  const strengthStyles = getStrengthStyles();

  return (
    // Center container like LoginScreen
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-md"
      >
        {/* Back button */}
        <button
          onClick={onSwitchToLogin}
          className="flex items-center gap-2 text-[#226d68] hover:text-[#18534f] transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Login</span>
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
                <CircleCheck size={80} className="text-[#226d68]" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                  className="absolute -top-2 -right-2"
                >
                  <Shield size={32} className="text-[#d6955b]" />
                </motion.div>
              </div>
            </motion.div>
            <h2 className="text-3xl mb-4 text-[#18534f]">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-8">Your password has been successfully reset.<br />You can now login with your new password.</p>
            <AuthButton variant="primary" onClick={onSwitchToLogin}>Continue to Login</AuthButton>
          </div>
        ) : (
          <>
            {/* Form Header */}
            <div className="text-center mb-8">
              <motion.div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ecf8f6] mb-4">
                <Shield size={32} className="text-[#226d68]" />
              </motion.div>
              <h1 className="text-4xl mb-2 text-[#18534f]">Reset Password</h1>
              <p className="text-gray-600">Create a strong new password for your account.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthInput
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
              />

              {/* Password strength */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Password strength:</span>
                    <span className="text-sm font-medium" style={{ color: strengthStyles.color }}>
                      {strengthStyles.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthStyles.barColor} rounded-full`} style={{ width: strengthStyles.width }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use 8+ characters with uppercase, lowercase, numbers & symbols
                  </p>
                </div>
              )}

              <AuthInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
              />

              <AuthButton variant="primary" isLoading={isLoading} type="submit">
                Reset Password
              </AuthButton>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
