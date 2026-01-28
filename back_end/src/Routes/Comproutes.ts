import { Router } from "express";
import Create from "../Controllers/Account/Create";
import multer from "multer";
import { authMiddleware } from "../Middleware/authMiddlware";


const ComptRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

console.log("ComptRoutes loaded");

ComptRouter.post("/update/profile", authMiddleware, upload.single('profileImage'), Create);

export default ComptRouter;

