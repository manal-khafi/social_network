"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTwoFactorAuthStatus = exports.disableTwoFactorAuth = exports.enableTwoFactorAuth = exports.setupTwoFactorAuth = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const encryption_1 = require("../../util/encryption");
const setupTwoFactorAuth = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const user = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const secret = speakeasy_1.default.generateSecret({ length: 20, name: `ANMOUGAR:${user.email}` });
        const encryptedSecret = (0, encryption_1.encrypt)(secret.base32);
        await prismaClient_1.default.user.update({
            where: { id: userId },
            data: { two_factor_temp_secret: encryptedSecret },
        });
        qrcode_1.default.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return res.status(500).json({ message: 'Error generating QR code' });
            }
            res.json({
                qrCodeDataUrl: data_url,
                manualKey: secret.base32,
            });
        });
    }
    catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.setupTwoFactorAuth = setupTwoFactorAuth;
const enableTwoFactorAuth = async (req, res) => {
    const userId = req.user?.id;
    const { code } = req.body;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: 'Invalid code format. Must be 6 digits.' });
    }
    try {
        const user = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.two_factor_temp_secret) {
            return res.status(409).json({ message: '2FA setup has not been initiated.' });
        }
        const decryptedSecret = (0, encryption_1.decrypt)(user.two_factor_temp_secret);
        const verified = speakeasy_1.default.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (!verified) {
            return res.status(403).json({ message: 'Invalid TOTP code.' });
        }
        await prismaClient_1.default.user.update({
            where: { id: userId },
            data: {
                two_factor_secret: user.two_factor_temp_secret,
                two_factor_enabled: true,
                two_factor_confirmed_at: new Date(),
                two_factor_temp_secret: null,
            },
        });
        res.json({ success: true, twoFactorEnabled: true });
    }
    catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.enableTwoFactorAuth = enableTwoFactorAuth;
const disableTwoFactorAuth = async (req, res) => {
    const userId = req.user?.id;
    const { code } = req.body;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: 'Invalid code format. Must be 6 digits.' });
    }
    try {
        const user = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.two_factor_secret || !user.two_factor_enabled) {
            return res.status(400).json({ message: '2FA is not enabled.' });
        }
        const decryptedSecret = (0, encryption_1.decrypt)(user.two_factor_secret);
        const verified = speakeasy_1.default.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (!verified) {
            return res.status(403).json({ message: 'Invalid TOTP code.' });
        }
        await prismaClient_1.default.user.update({
            where: { id: userId },
            data: {
                two_factor_enabled: false,
                two_factor_secret: null,
                two_factor_confirmed_at: null,
                two_factor_temp_secret: null,
            },
        });
        res.json({ success: true, twoFactorEnabled: false });
    }
    catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.disableTwoFactorAuth = disableTwoFactorAuth;
const getTwoFactorAuthStatus = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const user = await prismaClient_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ twoFactorEnabled: user.two_factor_enabled });
    }
    catch (error) {
        console.error('2FA status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTwoFactorAuthStatus = getTwoFactorAuthStatus;
