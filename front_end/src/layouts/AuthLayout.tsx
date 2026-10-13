import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-anm-background via-white to-anm-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <span className="text-2xl text-primary-foreground font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">ANMOUGAR</h1>
          <p className="text-muted-foreground">{t("auth.connectShareDiscover")}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
