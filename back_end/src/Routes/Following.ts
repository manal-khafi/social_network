import { Router } from "express";
import Follow from "../Controllers/Following/Follow";
import Unfollow from "../Controllers/Following/Unfolow";
import Acceptdemande from "../Controllers/Following/Acceptfolow";
import { refuseFollowRequest } from "../Controllers/Following/Refusedemande";
import Following from "../Controllers/Following/Folloing";
import Follower from "../Controllers/Following/Follower";
import { authMiddleware } from "../Middlware/authMiddlware";

const FollowRoutes= Router();

FollowRoutes.post("/follow/:userIdToFollow",authMiddleware, Follow);
FollowRoutes.delete("/unfollow/:userIdToUnfollow",authMiddleware, Unfollow);
FollowRoutes.post("/accept-follow/:demandeId",authMiddleware, Acceptdemande);
FollowRoutes.post("/refuse-follow/:requestId",authMiddleware, refuseFollowRequest);
FollowRoutes.get("/following/:userId",authMiddleware, Following);
FollowRoutes.get("/followers/:userId",authMiddleware, Follower);

export default FollowRoutes;

