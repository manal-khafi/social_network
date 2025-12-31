import { Router } from "express";
import { forgotPassword } from "../Controllers/Authentification/authController";

const router = Router();

// Endpoint forgot password
router.post("/forgot-password", forgotPassword);

export default router;
