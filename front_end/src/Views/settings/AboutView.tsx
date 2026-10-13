import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Card } from '../../Components/ui/card';

import { useTranslation } from 'react-i18next';
const features = [
  "Authentication (email/password and social)",
  "settings.aboutFeatures.feed",
  "settings.aboutFeatures.createPosts",
  "settings.aboutFeatures.stories",
  "settings.aboutFeatures.inbox",
  "settings.aboutFeatures.notifications",
  "settings.aboutFeatures.profiles",
  "settings.aboutFeatures.privacy",
  "settings.aboutFeatures.appearance",
  "settings.aboutFeatures.archives"
];

export default function AboutView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const version = "v1.0.0"; // Hardcoded as per instructions

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t("settings.aboutAnmougar")}</h1>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">{t("settings.whatIsAnmougar")}</h2>
          <p className="text-muted-foreground">
            {t("settings.anmougarIsAContentFirstSocial")}
          </p>
          <p className="text-muted-foreground mt-2">
            {t("settings.theNameAnmougarIsAUnique")}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t("settings.features")}</h2>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">{t(feature)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">{t("settings.yourPrivacy")}</h2>
          <p className="text-muted-foreground">
            {t("settings.usersControlTheirPrivacyAndAccount")}
          </p>
        </Card>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>{t("settings.version", { version })}</p>
        </div>
      </div>
    </div>
  );
}
