import React, { useState } from "react";
import { motion } from "framer-motion";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { SocialButton } from "./SocialButton";
import { handleSocialAuth } from "./socialAuth";
import { Logo } from "./Logo";

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSwitchToLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const url = "http://localhost:3500/api/authentification";
      const method = "POST";

      const response = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        alert(data.message); 
        onSwitchToLogin();
      } else {
        alert(data.message || "Registration failed. Please try again.");
      }

    } catch (error) {
      setIsLoading(false);
      alert("Server error. Please try again later.");
      console.error("Registration error:", error);
    }
  };

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
          Join our community today!
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: "" });
          }}
          error={errors.password}
          required
        />

        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
          }}
          error={errors.confirmPassword}
          required
        />

        <AuthButton variant="primary" isLoading={isLoading} type="submit">
          Create Account
        </AuthButton>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <div className="space-y-3">
        <SocialButton provider="google" onClick={() => handleSocialAuth("google")} />
        <SocialButton provider="facebook" onClick={() => handleSocialAuth("facebook")} />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-[#d6955b] hover:text-[#c8864d] transition-colors"
          >
            Login
          </button>
        </p>
      </div>
    </motion.div>
  );
};