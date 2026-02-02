"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordController = exports.verifyResetTokenController = void 0;
const authService_1 = require("../../Service/authService");
const verifyResetTokenController = async (req, res) => {
    const { token } = req.params;
    console.log(token);
    if (!token)
        return res.status(400).json({ success: false, message: "Token requis" });
    const user = await (0, authService_1.verifyResetToken)(token);
    if (!user)
        return res.status(400).json({ success: false, message: "Token invalide ou expiré" });
    res.status(200).json({ success: true, message: "Token valide" });
};
exports.verifyResetTokenController = verifyResetTokenController;
const resetPasswordController = async (req, res) => {
    console.log("🔥 RESET PASSWORD HIT");
    console.log("BODY:", req.body);
    const { token, newPassword } = req.body;
    console.log("Received token:", token);
    console.log("Received newPassword:", newPassword);
    if (!token || !newPassword)
        return res.status(400).json({ success: false, message: "Champs manquants" });
    try {
        await (0, authService_1.resetPassword)(token, newPassword);
        res.status(200).json({ success: true, message: "Mot de passe mis à jour avec succès" });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.resetPasswordController = resetPasswordController;
