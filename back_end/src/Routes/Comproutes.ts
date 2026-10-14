import { Router } from "express";
import Create from "../Controllers/Account/Create";
import { authMiddleware } from "../Middleware/authMiddlware";

const ComptRouter = Router();

// JSON body: { userData: "<json>" }. The profile picture is not sent here; it
// goes through POST /api/upload and only its URL is part of userData.
ComptRouter.post("/update/profile", authMiddleware, Create);

export default ComptRouter;
