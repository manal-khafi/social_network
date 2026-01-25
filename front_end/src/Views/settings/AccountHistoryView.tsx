import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Lock, FileSignature } from 'lucide-react';
import { Card } from '../../Components/ui/card';

const historyItems = [
  {
    date: '2023-01-01',
    event: 'Account Created',
    description: 'You joined ANMOUGAR.',
    icon: User,
    color: 'text-green-500',
  },
  {
    date: '2023-03-15',
    event: 'Profile Updated',
    description: 'You changed your bio.',
    icon: FileSignature,
    color: 'text-blue-500',
  },
  {
    date: '2023-06-20',
    event: 'Privacy Changed',
    description: 'Your account was set to Private.',
    icon: Lock,
    color: 'text-red-500',
  },
  {
    date: '2023-09-01',
    event: 'Profile Updated',
    description: 'You updated your username.',
    icon: FileSignature,
    color: 'text-blue-500',
  },
];

export default function AccountHistoryView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Account History</h1>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Account Timeline (Placeholder)</h2>
          <div className="relative border-l-2 border-border ml-2">
            {historyItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="mb-8 ml-6">
                  <span className={`absolute -left-4 flex items-center justify-center w-8 h-8 bg-muted rounded-full ${item.color}`}>
                    <Icon className="w-5 h-5 text-card-foreground" />
                  </span>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                  <h3 className="font-semibold">{item.event}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            This is placeholder data. Backend is not yet implemented.
          </p>
        </Card>
      </div>
    </div>
  );
}
