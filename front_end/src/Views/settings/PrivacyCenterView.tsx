import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../Components/ui/card';


import { useTranslation } from 'react-i18next';

export default function PrivacyCenterView() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t("settings.privacyCenter")}</h1>
      </div>
      
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">{t("settings.ourCommitmentToPrivacy")}</h2>
          <p className="text-muted-foreground">
            {t("settings.privacyCenterIntro")}
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">{t("settings.dataCollection")}</h2>
          <p className="text-muted-foreground">
            {t("settings.weCollectDataToProvideAnd")}
          </p>
        </Card>
      </div>
    </div>
  );
}
