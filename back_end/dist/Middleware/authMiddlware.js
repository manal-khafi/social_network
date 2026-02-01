"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../util/jwt");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const hasBearer = authHeader?.startsWith("Bearer ");
        if (!hasBearer) {
            const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
            if (!refreshToken) {
                return res.status(401).json({ message: "Token manquant" });
            }
            const decodedRefresh = (0, jwt_1.verifyRefreshToken)(refreshToken);
            const user = await prismaClient_1.default.user.findUnique({
                where: { id: decodedRefresh.id },
                include: {
                    role: {
                        include: {
                            rolePermissions: { include: { permission: true } },
                        },
                    },
                },
            });
            if (!user || user.token_version !== decodedRefresh.token_version) {
                return res.status(401).json({ message: "Invalid refresh token" });
            }
            const permissions = user.role?.rolePermissions.map((p) => p.permission.name) || [];
            const newAccessToken = (0, jwt_1.generateAccessToken)({
                id: user.id,
                email: user.email,
                username: user.username,
                avatar_url: user.avatar_url ?? null,
                role: user.role?.name,
                permissions,
            });
            res.setHeader("x-access-token", newAccessToken);
            req.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar_url: user.avatar_url ?? null,
                role: user.role?.name,
                permissions,
                onboarding_done: user.onboarding_done
            };
            return next();
        }
        // ✅ Normal path: access token exists
        const token = authHeader.split(" ")[1];
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = decoded;
            return next();
        }
        catch (err) {
            // expired -> try refresh (your existing logic)
            if (err instanceof Error && err.name !== "TokenExpiredError") {
                return res.status(401).json({ message: "Token invalide" });
            }
            const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
            if (!refreshToken) {
                return res.status(401).json({ message: "Refresh token manquant" });
            }
            const decodedRefresh = (0, jwt_1.verifyRefreshToken)(refreshToken);
            const user = await prismaClient_1.default.user.findUnique({
                where: { id: decodedRefresh.id },
                include: {
                    role: {
                        include: {
                            rolePermissions: { include: { permission: true } },
                        },
                    },
                },
            });
            if (!user || user.token_version !== decodedRefresh.token_version) {
                return res.status(401).json({ message: "Invalid refresh token" });
            }
            const permissions = user.role?.rolePermissions.map((p) => p.permission.name) || [];
            const newAccessToken = (0, jwt_1.generateAccessToken)({
                id: user.id,
                email: user.email,
                username: user.username,
                avatar_url: user.avatar_url ?? null,
                role: user.role?.name,
                permissions,
            });
            res.setHeader("x-access-token", newAccessToken);
            req.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar_url: user.avatar_url ?? null,
                role: user.role?.name,
                permissions,
                onboarding_done: user.onboarding_done
            };
            return next();
        }
    }
    catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
exports.authMiddleware = authMiddleware;
