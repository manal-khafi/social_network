"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryExpirationService = void 0;
const story_service_1 = require("./story.service");
class StoryExpirationService {
    /**
     * Démarre le service d'expiration automatique des stories
     * Vérifie toutes les heures et archive les stories expirées
     */
    static startAutoExpiration() {
        // Vérifier immédiatement au démarrage
        story_service_1.StoryService.archiveExpiredStories().catch((error) => {
            console.error('Erreur lors de l\'archivage initial des stories:', error);
        });
        // Puis vérifier toutes les heures
        this.intervalId = setInterval(async () => {
            try {
                const result = await story_service_1.StoryService.archiveExpiredStories();
                console.log(`Stories expirées archivées: ${result.archived_count}`);
            }
            catch (error) {
                console.error('Erreur lors de l\'archivage automatique des stories:', error);
            }
        }, 60 * 60 * 1000); // 1 heure
        console.log('Service d\'expiration automatique des stories démarré');
    }
    /**
     * Arrête le service d'expiration automatique
     */
    static stopAutoExpiration() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Service d\'expiration automatique des stories arrêté');
        }
    }
}
exports.StoryExpirationService = StoryExpirationService;
StoryExpirationService.intervalId = null;
