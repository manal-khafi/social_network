import { Router } from "express";
import { socialLogin } from "../Controllers/Authentification/social";

const router = Router();

router.post("/social-login", socialLogin);

export default router;
