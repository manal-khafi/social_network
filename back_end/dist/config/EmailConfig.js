"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransporter = exports.initializeEmailService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
dotenv_1.default.config();
let Transporter = null;
const initializeEmailService = async () => {
    if (Transporter)
        return Transporter;
    Transporter = nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            servername: "smtp.gmail.com",
            rejectUnauthorized: false,
        },
    });
    await Transporter.verify();
    console.log("✅ Serveur SMTP connecté avec succès");
    return Transporter;
};
exports.initializeEmailService = initializeEmailService;
const getTransporter = async () => {
    if (!Transporter) {
        await (0, exports.initializeEmailService)();
    }
    return Transporter;
};
exports.getTransporter = getTransporter;
