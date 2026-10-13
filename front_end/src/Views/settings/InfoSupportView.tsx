import { useNavigate } from 'react-router-dom';
import { ChevronRight, HelpCircle, Shield, Info, ArrowLeft } from 'lucide-react';
import { Card } from '../../Components/ui/card';

import { useTranslation } from 'react-i18next';
// title / description are i18n keys, resolved with t() at render time.
const supportSections = [
  {
    id: 'help',
    title: 'settings.helpCenter',
    description: 'settings.helpCenterDescription',
    icon: HelpCircle,
    path: 'help',
    color: 'text-blue-500'
  },
  {
    id: 'privacy',
    title: 'settings.privacyCenter',
    description: 'settings.privacyCenterDescription',
    icon: Shield,
    path: 'privacy-center',
    color: 'text-green-500'
  },
  {
    id: 'about',
    title: 'settings.aboutAnmougar',
    description: 'settings.aboutDescription',
    icon: Info,
    path: 'about',
    color: 'text-gray-500'
  }
];

export default function InfoSupportView() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t("settings.support")}</h1>
      </div>
      
      <div className="p-4 space-y-2 max-w-2xl mx-auto pb-24">
        {supportSections.map((section) => {
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
                  <h3 className="font-semibold">{t(section.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(section.description)}</p>
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
