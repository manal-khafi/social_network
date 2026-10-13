import React, { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

// Spread onto <motion.input>, so the props are motion's input props.
interface AuthInputProps extends HTMLMotionProps<"input"> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="w-full">
        <label className="block text-sm text-[#18534f] mb-2">
          {label}
        </label>
        <div className="relative">
          <motion.input
            ref={ref}
            type={inputType}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white transition-all duration-200 focus:outline-none focus:border-[#226d68] focus:shadow-lg focus:shadow-[#226d68]/10"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            animate={{
              scale: isFocused ? 1.01 : 1,
            }}
            transition={{ duration: 0.2 }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#226d68] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 mt-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
