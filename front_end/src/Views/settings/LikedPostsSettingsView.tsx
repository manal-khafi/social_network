import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks'; // Pour récupérer le token
import { Card } from '../../Components/ui/card';
import PostCard from '../../Components/post/PostCard';
import { Heart, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function LikedPostsSettingsView() {
  const navigate = useNavigate();
  
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAppSelector((state) => state.auth);

  // --- APPEL API ---
  useEffect(() => {
    const getLikedPosts = async () => {
      try {
        setLoading(true);
        const response = await api.get("/posts/mylikes");
        setLikedPosts(response.data);
      } catch (err: any) {
        console.error("API error:", err);
        setError(err.response?.data?.message || "Could not load liked posts");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      getLikedPosts();
    } else {
      setError("You must be signed in to see your liked posts");
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Liked Posts</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* État de chargement */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading your liked posts...</p>
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <Card className="p-6 border-destructive/50 bg-destructive/10 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-destructive" />
            <p className="font-medium text-destructive">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 text-sm underline"
            >
              Try again
            </button>
          </Card>
        )}

        {/* Liste vide */}
        {!loading && !error && likedPosts.length === 0 && (
          <Card className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No liked posts yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Posts you like will appear here.
            </p>
          </Card>
        )}

        {/* Affichage des posts */}
        {!loading && !error && likedPosts.length > 0 && (
          <div className="space-y-4">
            {likedPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}