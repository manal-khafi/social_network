import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card } from '../../Components/ui/card';

export default function ContentSharedView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Content You Shared</h1>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Content History Not Available</h2>
          <p className="text-muted-foreground">
            The backend for tracking shared content is not yet implemented.
            This view will show a list of your posts and other content once it is available.
          </p>
        </Card>
      </div>
    </div>
  );
}
