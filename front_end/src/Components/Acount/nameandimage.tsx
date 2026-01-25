import React, { useState, useEffect } from 'react';
import { Upload, User, Camera, ArrowRight, ArrowLeft } from 'lucide-react';

interface SetupProfileProps {
  onUpdate: (data: { username: string; profileImage: string | null; imageFile: File | null }) => void;
  onSkip: () => void;
  onBack: () => void;
  initialData?: {
    username: string;
    profileImage: string | null;
  };
}

const SetupProfile: React.FC<SetupProfileProps> = ({ onUpdate, onSkip, onBack, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(initialData?.username || '');
  const [profileImage, setProfileImage] = useState<string | null>(initialData?.profileImage || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  // Update the parent whenever data changes
  useEffect(() => {
    if (username.trim() || profileImage) {
      const data = {
        username: username.trim(),
        profileImage,
        imageFile,
      };
      onUpdate(data);
    }
  }, [username, profileImage, imageFile, onUpdate]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("The image is too large (max 5MB)");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Choose a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Data is sent through the onUpdate callback
      onSkip(); // Move to next step
    } catch (error) {
      setError('Something went wrong, try again!');
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
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <User className="w-16 h-16 text-[#718197]/40" />
                  )}
                </div>

                {!profileImage && (
                  <div className="absolute -bottom-2 -right-2 bg-[#18534F] text-white rounded-full p-3 shadow-lg">
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
                  {profileImage ? 'Change photo' : 'Upload a photo'}
                </div>
                <input
                  type="file"
                  accept="image/*"
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
              Your username
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
                placeholder="e.g. alex_2024"
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
              Back
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
                hover:bg-white/50 transition"
            >
              Skip
            </button>

            <button
              type="submit"
              disabled={loading || !username.trim()}
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
                  Next
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
