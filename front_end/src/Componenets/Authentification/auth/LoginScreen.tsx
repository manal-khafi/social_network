import React, { useState } from "react";
import { motion } from "framer-motion";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { SocialButton } from "./SocialButton";
import { Logo } from "./Logo";

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = 'http://localhost:3500/api/authentification/login';
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.emailOrUsername, // backend expects 'email'
          password: formData.password,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log(data);

      if (data.success) {
        alert(data.message);
        localStorage.setItem("token", data.token);
        window.location.href = data.redirectTo || "/dashboard";
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Please try again later."); 
    }

    setIsLoading(false);
  };


  const handleSocialLogin = (provider: "google" | "facebook") => {
    console.log(`Login with ${provider}`);
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
          Welcome back! Please login to your account.
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Email or Username"
          type="text"
          placeholder="Enter your email or username"
          value={formData.emailOrUsername}
          onChange={(e) =>
            setFormData({ ...formData, emailOrUsername: e.target.value })
          }
          required
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
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
            className="text-sm text-[#226d68] hover:text-[#18534f] transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <AuthButton variant="primary" isLoading={isLoading} type="submit">
          Login
        </AuthButton>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <div className="space-y-3">
        <SocialButton provider="google" onClick={() => handleSocialLogin("google")} />
        <SocialButton provider="facebook" onClick={() => handleSocialLogin("facebook")} />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-[#d6955b] hover:text-[#c8864d] transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </motion.div>
  );
};