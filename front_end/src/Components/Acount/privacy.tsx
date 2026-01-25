import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Globe, Lock, Sparkles } from 'lucide-react';

interface PrivacySettingsProps {
  onSelect: (privacy: {
    type: 'public' | 'private';
    isPublic: boolean;
    approvedFollowersOnly: boolean;
  }) => void;
  onSkip: () => void;
  onBack: () => void;
  onComplete: () => void;
  selectedValue?: {
    type: 'public' | 'private';
    isPublic: boolean;
    approvedFollowersOnly: boolean;
  };
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  onSelect,
  onSkip,
  onBack,
  onComplete,
  selectedValue,
}) => {
  const [privacyType, setPrivacyType] = useState<'public' | 'private' | null>(
    selectedValue?.type || null
  );
  const [loading, setLoading] = useState(false);

  const privacyOptions = [
    {
      id: 'public',
      label: 'Public Account',
      icon: <Globe className="w-7 h-7" />,
      description: 'Anyone can see your profile and posts',
      color: 'from-[#18534F] to-[#718197]',
      bgColor: 'bg-gradient-to-br from-[#ECF8F6] to-blue-50',
      borderColor: 'border-[#18534F]/30',
      features: [
        'Profile visible to everyone',
        'Posts accessible to all',
        'Easy for friends to find you',
        'Great for networking',
      ],
    },
    {
      id: 'private',
      label: 'Private Account',
      icon: <Lock className="w-7 h-7" />,
      description: 'Only approved followers can see your posts',
      color: 'from-[#D6955B] to-[#FEEAA1]',
      bgColor: 'bg-gradient-to-br from-amber-50 to-[#FEEAA1]/30',
      borderColor: 'border-[#D6955B]/40',
      features: [
        'Full control of your audience',
        'Manual follower approval',
        'Protected posts',
        'Maximum privacy',
      ],
    },
  ];

  const handleContinue = async () => {
    if (!privacyType) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Send privacy settings to parent
      const privacyData = {
        type: privacyType,
        isPublic: privacyType === 'public',
        approvedFollowersOnly: privacyType === 'private',
      };

      onSelect(privacyData);

      // Call completion function (go to summary)
      onComplete();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Send default settings (public)
    const defaultPrivacy = {
      type: 'public' as 'public' | 'private',
      isPublic: true,
      approvedFollowersOnly: false,
    };

    onSelect(defaultPrivacy);
    onSkip();
  };

  const handlePrivacySelect = (type: 'public' | 'private') => {
    setPrivacyType(type);

    // Optional: send selection immediately to parent
    // const privacyData = {
    //   type,
    //   isPublic: type === 'public',
    //   approvedFollowersOnly: type === 'private'
    // };
    // onSelect(privacyData);
  };

  return (
    <div className="min-h-screen bg-[#ECF8F6] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-[#18534F] mb-3">
            Account Privacy
          </h1>
          <p className="text-[#718197]">
            Choose who can see your information and posts
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {privacyOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handlePrivacySelect(option.id as 'public' | 'private')}
              className={`p-6 rounded-xl border-3 transition-all duration-300 ${
                privacyType === option.id
                  ? `border-[#18534F] shadow-xl scale-[1.02]`
                  : 'border-[#718197]/20 hover:border-[#18534F]/40 hover:shadow-lg'
              } ${option.bgColor}`}
            >
              <div className="text-left h-full flex flex-col">
                {/* Icon + title */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-full ${
                      option.id === 'public'
                        ? 'bg-[#18534F]/10'
                        : 'bg-[#D6955B]/10'
                    }`}
                  >
                    <div
                      className={
                        option.id === 'public'
                          ? 'text-[#18534F]'
                          : 'text-[#D6955B]'
                      }
                    >
                      {option.icon}
                    </div>
                  </div>

                  {privacyType === option.id && (
                    <div className="w-6 h-6 rounded-full bg-[#18534F] flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>

                <h3
                  className={`font-bold text-xl mb-2 ${
                    option.id === 'public'
                      ? 'text-[#18534F]'
                      : 'text-[#D6955B]'
                  }`}
                >
                  {option.label}
                </h3>

                <p className="text-[#718197] mb-6">{option.description}</p>

                <div className="space-y-3 mb-6 flex-grow">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-3 ${
                          option.id === 'public'
                            ? 'bg-[#18534F]'
                            : 'bg-[#D6955B]'
                        }`}
                      ></div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div
                  className={`mt-auto text-center py-2 rounded-lg font-medium ${
                    privacyType === option.id
                      ? 'bg-[#18534F] text-white'
                      : 'bg-white/50 text-[#718197]'
                  }`}
                >
                  {privacyType === option.id ? '✓ Selected' : 'Select'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Information */}
        <div className="mb-8">
          <div className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-[#718197]/20">
            <div className="p-2 bg-[#FEEAA1]/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-[#D6955B]" />
            </div>
            <div>
              <h4 className="font-medium text-[#18534F] mb-1">
                Our recommendation
              </h4>
              <p className="text-sm text-[#718197]">
                Start with a{' '}
                <span className="font-bold text-[#18534F]">Public</span> account
                to make friends easily. You can switch to{' '}
                <span className="font-bold text-[#D6955B]">Private</span> anytime
                in your settings.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
              hover:bg-white/50 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleSkip}
            className="flex-1 py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
              hover:bg-white/50 transition"
          >
            Default (Public)
          </button>

          <button
            onClick={handleContinue}
            disabled={!privacyType || loading}
            className="flex-1 py-3 bg-gradient-to-r from-[#18534F] to-[#718197] text-white 
              rounded-lg hover:shadow-lg transition disabled:opacity-50 
              flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
