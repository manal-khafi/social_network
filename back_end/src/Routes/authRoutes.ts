import { Router } from "express";
import { forgotPasswordController } from "../Controllers/Authentification/authController";

const router = Router();

// Endpoint forgot password
router.post("/forgot-password", forgotPasswordController);

export default router;
