import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Centered spinner shown while a lazily-loaded page chunk is being fetched. */
export default function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("actions.loading2")}
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-20'}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
