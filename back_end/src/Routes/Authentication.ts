import { Router } from "express";
import { Login } from "../Controllers/Authentication/Login";
import { Register } from "../Controllers/Authentication/Register";
import verifyEmail from "../Controllers/Authentication/verifyemail";
import { forgotPasswordController } from "../Controllers/Authentication/forgotPassword";
import { resetPasswordController, verifyResetTokenController } from '../Controllers/Authentication/resetPassword';
import { socialLogin } from "../Controllers/Authentication/social";
import { Logout } from "../Controllers/Authentication/Logout";
import { Me } from "../Controllers/Authentication/Me";
import { authLimiter, registerLimiter } from "../Middleware/rateLimiter";
import { authMiddleware } from "../Middleware/authMiddlware";
import { OnboardingComplete } from "../Controllers/Authentication/OnboardingComplete";

const AuthenticationRoutes = Router();

AuthenticationRoutes.post("/login", authLimiter, Login);
AuthenticationRoutes.post("/logout", Logout);
AuthenticationRoutes.get("/me", authMiddleware, Me);
AuthenticationRoutes.patch("/onboarding/complete", authMiddleware, OnboardingComplete);
AuthenticationRoutes.post("/", registerLimiter, Register);
AuthenticationRoutes.get("/verify-email", verifyEmail);
AuthenticationRoutes.post("/forgot-password", forgotPasswordController);
AuthenticationRoutes.get("/verify-reset-token/:token", verifyResetTokenController);
AuthenticationRoutes.post("/reset-password", resetPasswordController);
AuthenticationRoutes.post("/social-login", socialLogin);

export default AuthenticationRoutes;
