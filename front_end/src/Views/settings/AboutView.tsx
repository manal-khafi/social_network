import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Card } from '../../Components/ui/card';

const features = [
  "Authentication (email/password and social)",
  "Main feed with posts",
  "Create posts with text and images",
  "Stories viewer",
  "Real-time inbox and chats",
  "Notifications for interactions",
  "User profiles with followers/following",
  "Account privacy controls",
  "Appearance settings with dark mode",
  "Post and chat archives"
];

export default function AboutView() {
  const navigate = useNavigate();
  const version = "v1.0.0"; // Hardcoded as per instructions

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">About ANMOUGAR</h1>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">What is ANMOUGAR?</h2>
          <p className="text-muted-foreground">
            ANMOUGAR is a content-first social platform featuring feeds, posts, stories, messaging, communities, and notifications.
          </p>
          <p className="text-muted-foreground mt-2">
            The name “ANMOUGAR” is a unique brand identity representing connection, sharing, and community.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Features</h2>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Your Privacy</h2>
          <p className="text-muted-foreground">
            Users control their privacy and account settings. You can manage who sees your content and interacts with you through the Privacy settings.
          </p>
        </Card>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Version {version}</p>
        </div>
      </div>
    </div>
  );
}
