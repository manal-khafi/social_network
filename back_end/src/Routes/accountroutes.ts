import { Router } from "express";
import { authMiddleware } from "../Middleware/authMiddlware";
import {
  changePassword,
  deactivateAccount,
  deleteAccount,
} from "../Controllers/Account/accountcontroller";

const router = Router();

router.put("/me/password", authMiddleware, changePassword);
router.post("/me/deactivate", authMiddleware, deactivateAccount);
router.delete("/me/delete", authMiddleware, deleteAccount);

export default router;
