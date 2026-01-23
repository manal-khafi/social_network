import { Router } from "express";
import Create from "../Controllers/Compte/Create";
import multer from "multer";
import { authMiddleware } from "../Middlware/authMiddlware";

const ComptRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

console.log("ComptRoutes loaded");

ComptRouter.post("/update/profile", authMiddleware, upload.single('profileImage'), Create);

export default ComptRouter;

