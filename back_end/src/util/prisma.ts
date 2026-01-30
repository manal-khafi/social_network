import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
// Charger les variables d'environnement avant d'initialiser Prisma (chemin explicite)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
if (!process.env.DATABASE_URL) {
	console.warn('DATABASE_URL manquant : vérifiez le fichier .env');
}

const prisma = new PrismaClient();

export default prisma;