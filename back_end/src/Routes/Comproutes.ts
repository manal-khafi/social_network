import { Router } from "express";
import Create from "../Controllers/Compte/Create";
import { authMiddleware } from "../Middlware/authMiddlware";
import multer from "multer";

const ComptRouter = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

// Add auth middleware and multer for file uploads
ComptRouter.post(
  "/update/profile",
  authMiddleware,
  upload.single("profileImage"),
  Create
);

export default ComptRouter;
