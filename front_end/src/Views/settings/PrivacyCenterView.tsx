import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../Components/ui/card';

export default function PrivacyCenterView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Privacy Center</h1>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Our Commitment to Privacy</h2>
          <p className="text-muted-foreground">
            This is a placeholder for the Privacy Center. Here you would find detailed information about our privacy policy, how we use your data, and your rights as a user. We are committed to protecting your personal information.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Data Collection</h2>
          <p className="text-muted-foreground">
            We collect data to provide and improve our services. This includes information you provide when you create an account, as well as usage data.
          </p>
        </Card>
      </div>
    </div>
  );
}
