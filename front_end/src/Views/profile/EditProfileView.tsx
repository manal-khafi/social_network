import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProfileEditorSection from "../../Components/Profile/ProfileEditorSection";
import { PATHS } from "../../routes/paths";
import { useTranslation } from "react-i18next";

export default function EditProfileView() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
          <button onClick={() => navigate(PATHS.PROFILE_ME)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold">{t("profile.editProfile")}</h2>
        </div>

        <div className="p-4">
          <ProfileEditorSection
            showCover
            showSaveButton
            onSaved={() => navigate(PATHS.PROFILE_ME)}
          />
        </div>
      </div>
    </div>
  );
}
