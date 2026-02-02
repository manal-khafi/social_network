"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorLimiter = exports.registerLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
    message: {
        success: false,
        message: "Too many login attempts, please try again after 15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // Limit each IP to 5 registration requests per hour
    message: {
        success: false,
        message: "Too many accounts created from this IP, please try again after an hour"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.twoFactorLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 5, // Limit each IP to 5 requests per 5 minutes
    message: {
        success: false,
        message: "Too many attempts, please try again after 5 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
