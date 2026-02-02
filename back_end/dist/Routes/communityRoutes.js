"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const communityControllers_1 = __importDefault(require("../Controllers/Community/communityControllers"));
const communityRequests_1 = __importDefault(require("../Controllers/Community/communityRequests"));
const communityMembers_1 = __importDefault(require("../Controllers/Community/communityMembers"));
const communityRules_1 = __importDefault(require("../Controllers/Community/communityRules"));
const routes = express_1.default.Router();
// this is routes for community crud
routes.post("/", communityControllers_1.default.createCommunity);
routes.get("/", communityControllers_1.default.getAllCommunities);
routes.get("/:id", communityControllers_1.default.getCommunityById);
routes.put("/:id", communityControllers_1.default.modifyCommunity); // Add PUT support
routes.patch("/:id", communityControllers_1.default.modifyCommunity); // Keep PATCH for backward compatibility
routes.delete("/:id", communityControllers_1.default.deleteCommunity);
// this route for handeling the request and send it
routes.get("/:communityId/requests", communityRequests_1.default.communityRequest);
routes.post("/:communityId/request/:userId", communityRequests_1.default.createCommunityRequest);
routes.patch("/:communityId/requests/:requestId/:userId", communityRequests_1.default.handlerequest);
// this route for community members
routes.patch("/:communityId/members/:userId/role", communityMembers_1.default.giveMemberRole);
routes.get("/:communityId/members", communityMembers_1.default.getCommunityMembers);
routes.get("/:communityId/members/:userId", communityMembers_1.default.getOneCommunityMember);
routes.get("/:communityId/members/:userId/status", communityMembers_1.default.checkMembershipStatus);
routes.delete("/:communityId/members/:userId", communityMembers_1.default.DeleteCommunityMember);
// this route for community rules
routes.get("/:communityId/rules", communityRules_1.default.getCommunityRules);
routes.post("/:communityId/rules", communityRules_1.default.createCommunityRule);
routes.put("/:communityId/rules/:ruleId", communityRules_1.default.updateCommunityRule);
routes.delete("/:communityId/rules/:ruleId", communityRules_1.default.deleteCommunityRule);
exports.default = routes;
