import { useAppSelector } from "../../hooks";
import { useTranslation } from "react-i18next";

export function SkipToContent() {
  const { t } = useTranslation();
  const { screenReader } = useAppSelector((state) => state.accessibility);

  if (!screenReader) {
    return null;
  }

  return (
    <a href="#main-content" className="a11y-skip-link">
      {t("actions.skipToContent")}
    </a>
  );
}
