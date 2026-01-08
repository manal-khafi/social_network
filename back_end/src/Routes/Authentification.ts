import { Router } from "express";
import { Login } from "../Controllers/Authentification/Login";
import { Register } from "../Controllers/Authentification/Register";
import verifyEmail from "../Controllers/Authentification/verifyemail";
import { forgotPasswordController } from "../Controllers/Authentification/forgotPassword";
import { resetPasswordController, verifyResetTokenController } from '../Controllers/Authentification/resetPassword';
import { socialLogin } from "../Controllers/Authentification/social";

const AuthentificationRoutes = Router();

AuthentificationRoutes.post("/login", Login);
AuthentificationRoutes.post("/", Register);
AuthentificationRoutes.get("/verify-email", verifyEmail);
AuthentificationRoutes.post("/forgot-password", forgotPasswordController);
AuthentificationRoutes.get("/verify-reset-token/:token", verifyResetTokenController);
AuthentificationRoutes.post("/reset-password", resetPasswordController);
AuthentificationRoutes.post("/social-login", socialLogin);

export default AuthentificationRoutes;
