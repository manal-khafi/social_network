import { Router } from "express";
import {
  blockUser,
  unblockUser,
  checkBlock,
  getBlockStatus,
  getBlockedCount,
  getBlockedUsers,
} from "../Controllers/Block/BlockController";
import { authMiddleware } from "../Middleware/authMiddlware";

const BlockRoutes = Router();
BlockRoutes.use(authMiddleware);

BlockRoutes.post("/blocks", blockUser);

BlockRoutes.delete("/blocks", unblockUser);

BlockRoutes.get("/blocks/check/:targetUserId", checkBlock);

BlockRoutes.get("/blocks/status/:targetUserId", getBlockStatus);

BlockRoutes.get("/blocks/count", getBlockedCount);

BlockRoutes.get("/blocks", getBlockedUsers);

export default BlockRoutes;
