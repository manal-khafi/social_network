"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
// Charger les variables d'environnement avant d'initialiser Prisma (chemin explicite)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '..', '..', '.env') });
if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL manquant : vérifiez le fichier .env');
}
const prisma = new client_1.PrismaClient();
exports.default = prisma;
