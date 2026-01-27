import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppSelector } from '../../hooks'; // Pour récupérer votre token
import { ChevronRight, Archive, MessageSquare, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '../../Components/ui/card';

// URL de base de votre API
const API_BASE_URL = "http://localhost:3500/api";

export default function ArchiveView() {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  
  // États pour le backend
  const [postsCount, setPostsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fonction pour récupérer le nombre de posts archivés (Saves)
  const fetchArchivedData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/saves/archived`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // On compte le nombre d'éléments dans data
      setPostsCount(response.data.data?.length || 0);
    } catch (error) {
      console.error("Erreur lors de la récupération des archives:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedData();
  }, [token]);

  const archiveSections = [
    {
      id: 'chats',
      title: 'Archived Chats',
      description: 'View your archived conversations',
      icon: MessageSquare,
      path: 'chats',
      color: 'text-blue-500',
      count: null // Chat non touché
    },
    {
      id: 'posts',
      title: 'Archived Posts',
      description: postsCount !== null 
        ? `${postsCount} posts enregistrés` 
        : 'View your archived posts',
      icon: FileText,
      path: 'posts', // Redirige vers la vue détaillée des posts
      color: 'text-purple-500',
      count: postsCount
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <Archive className="w-6 h-6" />
          <h1 className="text-xl font-bold">Archive</h1>
        </div>
      </div>
      
      {/* Archive Sections */}
      <div className="p-4 space-y-2 max-w-2xl mx-auto pb-24">
        {archiveSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(section.path)}
            >
              <div className="p-4 flex items-center gap-4">
                <div className={`p-3 bg-muted rounded-full ${section.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{section.title}</h3>
                    {section.id === 'posts' && loading && (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {section.count !== null && (
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                      {section.count}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}