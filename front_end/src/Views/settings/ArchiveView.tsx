import { useNavigate } from 'react-router-dom';
import { ChevronRight, Archive, MessageSquare, FileText, ArrowLeft } from 'lucide-react';
import { Card } from '../../Components/ui/card';

const archiveSections = [
  {
    id: 'chats',
    title: 'Archived Chats',
    description: 'View your archived conversations',
    icon: MessageSquare,
    path: 'chats',
    color: 'text-blue-500'
  },
  {
    id: 'posts',
    title: 'Archived Posts',
    description: 'View your archived posts',
    icon: FileText,
    path: 'posts',
    color: 'text-purple-500'
  }
];

export default function ArchiveView() {
  const navigate = useNavigate();

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
