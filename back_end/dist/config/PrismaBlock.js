"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// back_end/src/config/PrismaBlock.ts
const client_1 = require("@prisma/client");
// Singleton pattern pour Prisma Client
class PrismaService {
    constructor() { }
    static getInstance() {
        if (!PrismaService.instance) {
            PrismaService.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === "development"
                    ? ["query", "error", "warn"]
                    : ["error"],
            });
        }
        return PrismaService.instance;
    }
    static async disconnect() {
        if (PrismaService.instance) {
            await PrismaService.instance.$disconnect();
        }
    }
}
exports.prisma = PrismaService.getInstance();
exports.default = PrismaService;
