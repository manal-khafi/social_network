import { Router } from "express";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "../Controllers/Settings/privacySettings";
import { authMiddleware } from "../Middleware/authMiddlware";

const router = Router();

router.get("/me/privacy", authMiddleware, getPrivacySettings);
router.patch("/me/privacy", authMiddleware, updatePrivacySettings);

export default router;
