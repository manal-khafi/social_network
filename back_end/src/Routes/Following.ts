import { Router } from "express";
import Follow from "../Controllers/Following/Follow";
import Unfollow from "../Controllers/Following/Unfolow";
import Acceptdemande from "../Controllers/Following/Acceptfolow";
import { refuseFollowRequest } from "../Controllers/Following/Refusedemande";
import Following from "../Controllers/Following/Folloing";
import Follower from "../Controllers/Following/Follower";
import { getFollowRequests } from "../Controllers/Following/FollowRequests";
import { authMiddleware } from "../Middleware/authMiddlware";

import { blockGuard } from "../Middleware/Block/blockGuardMiddleware";

const FollowRoutes= Router();

FollowRoutes.post("/follow/:userIdToFollow",authMiddleware, blockGuard(), Follow);
FollowRoutes.delete("/unfollow/:userIdToUnfollow",authMiddleware, blockGuard(), Unfollow);
FollowRoutes.post("/accept-follow/:demandeId",authMiddleware, blockGuard(), Acceptdemande);
FollowRoutes.post("/refuse-follow/:requestId",authMiddleware, blockGuard(), refuseFollowRequest);
FollowRoutes.get("/following/:userId",authMiddleware, blockGuard(), Following);
FollowRoutes.get("/followers/:userId",authMiddleware, blockGuard(), Follower);
FollowRoutes.get("/requests", authMiddleware, blockGuard(), getFollowRequests);

export default FollowRoutes;

