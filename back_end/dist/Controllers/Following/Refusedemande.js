"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuseFollowRequest = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const refuseFollowRequest = async (req, res) => {
    try {
        const { requestId } = req.params; // UUID string
        if (typeof requestId !== 'string') {
            return res.status(400).json({ message: "Invalid request ID" });
        }
        const followRequest = await prismaClient_1.default.follow.findUnique({
            where: { id: requestId } // Pas de parseInt ❌
        });
        if (!followRequest) {
            return res.status(404).json({ message: "Follow request not found" });
        }
        if (followRequest.status !== "pending") {
            return res.status(400).json({ message: "This request is not pending" });
        }
        // Optionnel : Vérifier que l’utilisateur connecté est bien celui qui doit répondre à la demande
        if (followRequest.followed_id !== req.user?.id) {
            return res.status(403).json({ message: "Not allowed to refuse this request" });
        }
        await prismaClient_1.default.follow.update({
            where: { id: requestId },
            data: { status: "rejected" }
        });
        return res.status(200).json({ message: "Follow request refused", status: "REJECTED" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};
exports.refuseFollowRequest = refuseFollowRequest;
