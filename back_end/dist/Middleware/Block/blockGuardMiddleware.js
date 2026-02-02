"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockGuard = void 0;
const BlockService_1 = require("../../../src/Service/BlockService");
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const blockGuard = (options) => {
    return async (req, res, next) => {
        try {
            const viewerId = req.user?.id;
            if (!viewerId) {
                return next();
            }
            let targetId;
            if (options?.getTargetId) {
                targetId = options.getTargetId(req);
            }
            else {
                targetId =
                    req.params.userId ||
                        req.params.targetUserId ||
                        req.body.userId ||
                        req.body.targetUserId ||
                        req.params.postId ||
                        req.body.postId;
            }
            if (!targetId) {
                return next();
            }
            let actualTargetUserId = targetId;
            if (req.params.postId || req.body.postId) {
                const post = await prismaClient_1.default.post.findUnique({
                    where: { id: targetId },
                    select: { user_id: true }
                });
                if (post) {
                    actualTargetUserId = post.user_id;
                }
                else {
                    return next();
                }
            }
            if (!actualTargetUserId) {
                return next();
            }
            const isBlocked = await (0, BlockService_1.isBlockedEitherWay)(viewerId, actualTargetUserId);
            if (isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: Interaction blocked.",
                });
            }
            next();
        }
        catch (error) {
            console.error("Error in blockGuard middleware:", error);
            next(error);
        }
    };
};
exports.blockGuard = blockGuard;
