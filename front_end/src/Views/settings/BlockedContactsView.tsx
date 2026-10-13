import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks'; // Pour récupérer le token d'authentification
import { ArrowLeft, UserX, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { toast } from 'sonner';


import { useTranslation } from 'react-i18next';

export default function BlockedContactsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // États locaux pour gérer les données et le chargement
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On récupère le token depuis ton store Redux (ajuste le chemin selon ton authSlice)
  const { token } = useAppSelector((state) => state.auth);

  // --- FONCTION : RÉCUPÉRER LA LISTE ---
const fetchBlockedList = async () => {
  try {
    setLoading(true);
    const response = await api.get("/blocks");
    setBlockedUsers(response.data.data || []);
  } catch (err: any) {
    if (!err.response) {
      // Pas de réponse du tout = Serveur éteint ou Mauvaise URL
      setError(t("errors.network"));
    } else {
      // Le serveur a répondu mais avec une erreur (401, 404, 500)
      setError(t("errors.withStatus", { status: err.response.status, message: err.response.data.message }));
    }
    console.error("Error details:", err);
  } finally {
    setLoading(false);
  }
};

  // --- FONCTION : DÉBLOQUER ---
  const handleUnblock = async (userId: string, username: string) => {
    try {
      // Ton controller DELETE /api/blocks attend { blockedUserId } dans le body
      await api.delete("/blocks", {
        data: { blockedUserId: userId },
      });
      
      toast.success(t("settings.userUnblocked", { username }));
      // Mettre à jour la liste locale après succès
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      toast.error(t("settings.failedToUnblock"));
    }
  };

  useEffect(() => {
    if (token) fetchBlockedList();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t("settings.blocked")}</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-lg">
            <UserX className="w-5 h-5" />
            {t("settings.blockedAccounts")}
            {!loading && (
              <span className="ms-auto text-sm bg-muted px-2 py-0.5 rounded-full">
                {blockedUsers.length}
              </span>
            )}
          </h2>

          {/* États : Chargement / Erreur / Liste Vide */}
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-center text-destructive p-4 flex flex-col items-center gap-2">
              <AlertCircle /> {error}
            </div>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("settings.noBlockedAccountsFound")}</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/50 border rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback>{(user.username?.[0] ?? '?').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.display_name || user.username}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleUnblock(user.id, user.username)}
                  >
                    {t("settings.unblock")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}