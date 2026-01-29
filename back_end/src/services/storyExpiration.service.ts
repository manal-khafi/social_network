import { StoryService } from './story.service';

export class StoryExpirationService {
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Démarre le service d'expiration automatique des stories
   * Vérifie toutes les heures et archive les stories expirées
   */
  static startAutoExpiration() {
    // Vérifier immédiatement au démarrage
    StoryService.archiveExpiredStories().catch((error) => {
      console.error('Erreur lors de l\'archivage initial des stories:', error);
    });

    // Puis vérifier toutes les heures
    this.intervalId = setInterval(async () => {
      try {
        const result = await StoryService.archiveExpiredStories();
        console.log(`Stories expirées archivées: ${result.archived_count}`);
      } catch (error) {
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

