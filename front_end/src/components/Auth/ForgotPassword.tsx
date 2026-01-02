import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, resetAuthState } from "../../store/slices/authSlice";
import type { RootState, AppDispatch } from "../../store";

interface ForgotPasswordProps {
  onBack: () => void;
}
export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, success, message, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");

  const validateEmail = (value: string) => {
    return /^\S+@\S+\.\S+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!email) {
      setLocalError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    dispatch(forgotPassword(email));
  };
  const handleTryAgain = () => {
    dispatch(resetAuthState());
    setEmail("");
    setLocalError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#ecf8f6]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 relative">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-center mb-6 text-2xl font-bold text-[#18534f]">
                ANMOUGAR
              </h1>
              <p className="text-center text-gray-600 text-sm">
                Enter your email to receive reset instructions.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#18534f] ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {(localError || error) && (
                  <p className="text-red-500 text-sm mt-1">
                    {localError || error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D6955B] text-white py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <button
                onClick={onBack}
                className="mt-4 flex items-center justify-center gap-2 w-full text-[#18534f] "
              >
                <ArrowLeft className="w-4 h-4 " />
                Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="bg-green-100 text-green-800 p-4 rounded-md">
                {message}
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleTryAgain}
                  className="w-full py-2 border rounded-md"
                >
                  Try Another Email
                </button>
                <button onClick={onBack} className="  w-full text-[#18534f] ">
                  Back to Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
