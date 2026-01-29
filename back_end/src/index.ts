import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import storyRoutes from './routes/story.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './utils/errors';
import { StoryExpirationService } from './services/storyExpiration.service';

// Charger les variables d'environnement
dotenv.config();

// Force restart for password test: postgres

const port = process.env.PORT || 3500;
const app = express();

// Sécurité avec Helmet
app.use(helmet());

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use((req, _res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

// Route de base
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API Social Network',
    version: '1.0.0',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);

// Gestion centralisée des erreurs (doit être après toutes les routes)
app.use(errorHandler);

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`🔐 Login disponible sur http://localhost:${port}/api/auth/login`);
  console.log(`📝 API Stories disponible sur http://localhost:${port}/api/stories`);

  // Démarrer le service d'expiration automatique des stories
  StoryExpirationService.startAutoExpiration();
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  StoryExpirationService.stopAutoExpiration();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt du serveur...');
  StoryExpirationService.stopAutoExpiration();
  process.exit(0);
});