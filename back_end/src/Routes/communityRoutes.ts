import express  from "express";
import communityControllers from "../Controllers/Community/communityControllers";
import communityRequest from "../Controllers/Community/communityRequests";
import communityMembers from "../Controllers/Community/communityMembers";

const routes = express.Router();

// this is routes for community crud
routes.post("/", communityControllers.createCommunity);
routes.get("/", communityControllers.getAllCommunities);
routes.get("/:id", communityControllers.getCommunityById);
routes.put("/:id", communityControllers.modifyCommunity); // Add PUT support
routes.patch("/:id", communityControllers.modifyCommunity); // Keep PATCH for backward compatibility
routes.delete("/:id", communityControllers.deleteCommunity);

// this route for handeling the request and send it
routes.get("/:communityId/requests", communityRequest.communityRequest);
routes.post("/:communityId/request/:userId", communityRequest.createCommunityRequest);
routes.patch("/:communityId/requests/:requestId/:userId", communityRequest.handlerequest);

// this route for community members
routes.patch("/:communityId/members/:userId/role", communityMembers.giveMemberRole);
routes.get("/:communityId/members", communityMembers.getCommunityMembers);
routes.get("/:communityId/members/:userId", communityMembers.getOneCommunityMember);
routes.delete("/:communityId/members/:userId", communityMembers.DeleteCommunityMember);



export default routes;  