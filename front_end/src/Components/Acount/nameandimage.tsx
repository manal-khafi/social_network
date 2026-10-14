import React, { useState, useEffect } from 'react';
import { Upload, User, Camera, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../hooks';
import { updateMyAvatar } from '../../features/user/userSlice';
import { uploadImageAndGetURL } from '../../utils/uploadImageAndGetURL';

interface SetupProfileProps {
  onUpdate: (data: { username: string; profileImage: string | null; imageFile: File | null }) => void;
  onSkip: () => void;
  onBack: () => void;
  initialData?: {
    username: string;
    profileImage: string | null;
    imageFile?: File | null;
  };
}

const SetupProfile: React.FC<SetupProfileProps> = ({ onUpdate, onSkip, onBack, initialData }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(initialData?.username || '');
  const dispatch = useAppDispatch();
  // "default" in the wizard data means "picture removed during the wizard".
  const [profileImage, setProfileImage] = useState<string | null>(
    initialData?.profileImage && initialData.profileImage !== 'default' ? initialData.profileImage : null
  );
  const [photoRemoved, setPhotoRemoved] = useState(initialData?.profileImage === 'default');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Update the parent whenever data changes. The picture is uploaded as soon as
  // it is picked, so the parent only ever receives its final URL (never a File).
  useEffect(() => {
    if (uploading) return;
    if (username.trim() || profileImage || photoRemoved) {
      onUpdate({
        username: username.trim(),
        profileImage: profileImage ?? (photoRemoved ? 'default' : null),
        imageFile: null,
      });
    }
  }, [username, profileImage, photoRemoved, uploading, onUpdate]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t("onboarding.theImageIsTooLargeMax"));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError(t("onboarding.pleaseSelectAnImageFile"));
      return;
    }

    // Show the picture straight away, then upload it and save it on the
    // profile so it is not lost if the wizard is left or reloaded.
    const previous = profileImage;
    const preview = URL.createObjectURL(file);
    setProfileImage(preview);
    setUploading(true);
    setError('');
    try {
      const url = await uploadImageAndGetURL(file, 'avatars');
      await dispatch(updateMyAvatar({ avatar_url: url })).unwrap();
      setProfileImage(url);
      setPhotoRemoved(false);
    } catch (err) {
      setProfileImage(previous);
      setError(err instanceof Error ? err.message : typeof err === 'string' ? err : t("errors.uploadFailed"));
    } finally {
      URL.revokeObjectURL(preview);
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPhotoRemoved(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError(t("onboarding.chooseAUsername"));
      return;
    }

    if (username.length < 3) {
      setError(t("onboarding.usernameMustBeAtLeast3"));
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Data is sent through the onUpdate callback
      onSkip(); // Move to next step
    } catch (error) {
      setError(t("onboarding.somethingWentWrongTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECF8F6] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo upload */}
          <div className="bg-white rounded-xl p-6 border border-[#718197]/10 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div
                  className={`w-32 h-32 rounded-full border-3 ${
                    profileImage ? 'border-[#D6955B]' : 'border-[#718197]/20'
                  } flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#ECF8F6] to-white`}
                >
                  {profileImage ? (
                    <>
                      <img
                        src={profileImage}
                        alt={t("onboarding.profilePreview")}
                        className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`}
                      />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-[#18534F]/30 border-t-[#18534F] rounded-full animate-spin"></div>
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={handleRemoveImage}
                        className="absolute top-1 end-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <User className="w-16 h-16 text-[#718197]/40" />
                  )}
                </div>

                {!profileImage && (
                  <div className="absolute -bottom-2 -end-2 bg-[#18534F] text-white rounded-full p-3 shadow-lg">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
              </div>

              <label className="cursor-pointer">
                <div
                  className="px-5 py-3 bg-gradient-to-r from-[#18534F] to-[#718197] text-white rounded-lg 
                  hover:shadow-lg transition flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {profileImage ? t("profile.changePhoto") : t("onboarding.uploadAPhoto")}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Username */}
          <div className="bg-white rounded-xl p-6 border border-[#718197]/10 shadow-sm">
            <h3 className="font-semibold text-[#18534F] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("onboarding.yourUsername")}
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  if (!initialData?.username) {
                    setUsername(e.target.value);
                    setError('');
                  }
                }}
                readOnly={!!initialData?.username}
                placeholder={t("onboarding.eGAlex2024")}
                className={`w-full px-4 py-3 border border-[#718197]/20 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-[#18534F]/30 focus:border-[#18534F]
                  placeholder:text-[#718197]/40 ${
                    initialData?.username ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                maxLength={20}
              />

              <div className="flex items-center justify-between text-sm">
                <span className={`${username.length > 15 ? 'text-[#D6955B]' : 'text-[#718197]'}`}>
                  {username.length}/20 characters
                </span>
                <span className="text-[#18534F] font-medium">
                  @{username || 'yourname'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
                hover:bg-white/50 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("actions.back")}
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
                hover:bg-white/50 transition"
            >
              {t("onboarding.skip")}
            </button>

            <button
              type="submit"
              disabled={loading || uploading || !username.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-[#18534F] to-[#718197] text-white 
                rounded-lg hover:shadow-lg transition disabled:opacity-50 
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  {t("actions.next")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupProfile;
