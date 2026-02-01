"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Me = void 0;
const Me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }
        const headerToken = res.getHeader("x-access-token");
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : undefined;
        const token = headerToken || bearerToken || null;
        return res.status(200).json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                username: req.user.username ?? "",
                avatar_url: req.user.avatar_url ?? null,
                role: req.user.role,
                permissions: req.user.permissions ?? [],
                onboarding_done: req.user.onboarding_done
            },
            token,
        });
    }
    catch (error) {
        console.error("Me endpoint error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
exports.Me = Me;
