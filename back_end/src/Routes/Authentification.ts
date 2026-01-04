import { Router } from "express";
import { Login } from "../Controllers/Authentification/Login";
import { Register } from "../Controllers/Authentification/Register";
import verifyEmail from "../Controllers/Authentification/verifyemail";

const AuthentificationRoutes = Router();

AuthentificationRoutes.post("/login", Login);
AuthentificationRoutes.post("/", Register);
AuthentificationRoutes.get("/verify-email", verifyEmail);

export default AuthentificationRoutes;
