import { Router } from "express";
import { signup } from "../Controllers/Authentification/authController";

const router = Router();

router.post("/signup", signup);

export default router;
