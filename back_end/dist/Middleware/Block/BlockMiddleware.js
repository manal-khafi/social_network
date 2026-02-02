"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBlockMiddleware = void 0;
const BlockService_1 = require("../../Service/BlockService");
const checkBlockMiddleware = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const targetUserId = req.params.userId || req.body.userId;
        if (!userId || !targetUserId)
            return next();
        const blocked = await (0, BlockService_1.isBlockedEitherWay)(userId, targetUserId);
        if (blocked) {
            return res.status(403).json({
                success: false,
                message: "Action non autorisée en raison d'un blocage",
            });
        }
        return next();
    }
    catch (error) {
        return next(error);
    }
};
exports.checkBlockMiddleware = checkBlockMiddleware;
