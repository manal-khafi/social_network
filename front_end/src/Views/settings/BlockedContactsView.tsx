import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppSelector } from '../../hooks'; // Pour récupérer le token d'authentification
import { ArrowLeft, UserX, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { toast } from 'sonner';

// --- CONFIGURATION API ---
const API_BASE_URL = "http://localhost:3500/api";

export default function BlockedContactsView() {
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
    console.log("Tentative de connexion sur : http://localhost:3500/api/blocks");
    
    const response = await axios.get("http://localhost:3500/api/blocks", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Réponse reçue :", response.data);
    setBlockedUsers(response.data.data || []);
  } catch (err: any) {
    if (!err.response) {
      // Pas de réponse du tout = Serveur éteint ou Mauvaise URL
      setError("Le serveur ne répond pas (Vérifiez qu'il est lancé sur le port 3500)");
    } else {
      // Le serveur a répondu mais avec une erreur (401, 404, 500)
      setError(`Erreur ${err.response.status}: ${err.response.data.message}`);
    }
    console.error("Détail erreur :", err);
  } finally {
    setLoading(false);
  }
};

  // --- FONCTION : DÉBLOQUER ---
  const handleUnblock = async (userId: string, username: string) => {
    try {
      // Ton controller DELETE /api/blocks attend { blockedUserId } dans le body
      await axios.delete(`${API_BASE_URL}/blocks`, {
        data: { blockedUserId: userId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`@${username} a été débloqué`);
      // Mettre à jour la liste locale après succès
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      toast.error("Erreur lors du déblocage");
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
        <h1 className="text-xl font-bold">Blocked Contacts</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-lg">
            <UserX className="w-5 h-5" />
            Blocked Accounts
            {!loading && (
              <span className="ml-auto text-sm bg-muted px-2 py-0.5 rounded-full">
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
            <p className="text-sm text-muted-foreground text-center py-6">No blocked accounts found.</p>
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
                    Unblock
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