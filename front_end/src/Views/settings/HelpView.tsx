import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../Components/ui/card';

export default function HelpView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Help Center</h1>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            This is a placeholder for the Help Center. Here you would find FAQs, guides, and contact information for support.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">How do I change my password?</h2>
          <p className="text-muted-foreground">
            You can change your password from the 'Account Settings' page, under the 'Security' section.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">How do I make my account private?</h2>
          <p className="text-muted-foreground">
            You can manage your account's privacy settings in the 'Privacy' section of the settings menu.
          </p>
        </Card>
      </div>
    </div>
  );
}
