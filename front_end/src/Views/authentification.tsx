import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { LoginScreen } from "../Components/Authentication/auth/LoginScreen.tsx";
import { RegisterScreen } from "../Components/Authentication/auth/RegisterScreen.tsx";
import { ForgotPasswordScreen } from "../Components/Authentication/auth/ForgotPasswordScreen.tsx";
import { ResetPasswordScreen } from "../Components/Authentication/auth/resetPassword.tsx";
import { LeftSide } from "../Components/Authentication/auth/LeftSide.tsx";

type Screen = "login" | "register" | "forgotPassword";

export default function AuthView() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");

  return (
    <>
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <LeftSide />
    <div className="min-h-screen bg-[#ecf8f6] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#feeaa1]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#226d68]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md">
        <AnimatePresence mode="wait">
          {currentScreen === "login" && (
            <LoginScreen
              key="login"
              onSwitchToRegister={() => setCurrentScreen("register")}
              onSwitchToForgotPassword={() =>
                setCurrentScreen("forgotPassword")
              }
            />
          )}

          {currentScreen === "register" && (
            <RegisterScreen
              key="register"
              onSwitchToLogin={() => setCurrentScreen("login")}
            />
          )}

          {currentScreen === "forgotPassword" && (
            <ForgotPasswordScreen
              key="forgotPassword"
              onSwitchToLogin={() => setCurrentScreen("login")}
            />
          )}
          {currentScreen === "resetPassword" && (
            <ResetPasswordScreen
              key="resetPassword"
              onSwitchToLogin={() => setCurrentScreen("login")}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  </>
  );
}
