import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, MessageCircle, Repeat, FileText, Clock, ArrowLeft } from 'lucide-react';
import { Card } from '../../Components/ui/card';

const activitySections = [
  {
    id: 'interactions',
    title: 'Interactions',
    description: 'Likes, comments, and reposts',
    icon: Heart,
    path: 'interactions',
    color: 'text-pink-500'
  },
  {
    id: 'content',
    title: 'Content You Shared',
    description: 'Posts, stories, and community content',
    icon: FileText,
    path: 'content',
    color: 'text-blue-500'
  },
  {
    id: 'history',
    title: 'Account History',
    description: 'Changes to your account and profile',
    icon: Clock,
    path: 'history',
    color: 'text-gray-500'
  }
];

export default function ActivityView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Your Activity</h1>
      </div>
      
      <div className="p-4 space-y-2 max-w-2xl mx-auto pb-24">
        {activitySections.map((section) => {
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
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
