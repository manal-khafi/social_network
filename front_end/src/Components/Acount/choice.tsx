import React, { useState } from 'react';
import { Check, SkipForward, ArrowRight, User, Settings } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

interface ChoixProps {
  onSelect: (choice: 'yes' | 'no' | 'skip') => void;
  onSkip: () => void;
}

const Choix: React.FC<ChoixProps> = ({ onSelect, onSkip }) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);
  const [loading, setLoading] = useState(false);

  const options = [
    {
      id: 'yes',
      title: t("onboarding.createYourStyle"),
      description: t("onboarding.customizeYourProfileWithYourPhoto"),
      icon: <User className="w-6 h-6" />,
      features: [
        'Profile picture',
        'Unique name',
        'Privacy settings',
        'Your preferences',
      ],
    },
    {
      id: 'no',
      title: t("onboarding.later"),
      description: t("onboarding.startWithTheDefaultSettings"),
      icon: <Settings className="w-6 h-6" />,
      features: [
        'Default profile',
        'Editable later',
        'Simple and fast',
      ],
    },
  ];

  const handleContinue = async () => {
    if (!selectedOption) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Send the choice to the parent via onSelect
      onSelect(selectedOption);

      // Note: Navigation is handled by the parent (PersonalizationWizard)
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Send 'skip' to the parent
    onSelect('skip');
    // Call parent skip handler
    onSkip();
  };

  const handleOptionClick = (optionId: 'yes' | 'no') => {
    setSelectedOption(optionId);
  };

  return (
    <div className="min-h-screen bg-[#ECF8F6] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[#718197]">
            {t("onboarding.wouldYouLikeToCreateYour")}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id as 'yes' | 'no')}
              className={`p-5 rounded-xl border-2 transition-all ${
                selectedOption === option.id
                  ? 'border-[#18534F] bg-white shadow-lg'
                  : 'border-[#718197]/20 bg-white/80 hover:border-[#18534F]/40'
              }`}
            >
              <div className="text-start">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-2 rounded-lg ${
                      option.id === 'yes'
                        ? 'bg-[#ECF8F6]'
                        : 'bg-gray-100'
                    }`}
                  >
                    {option.icon}
                  </div>
                  {selectedOption === option.id && (
                    <Check className="w-5 h-5 text-[#18534F]" />
                  )}
                </div>

                <h3 className="font-bold text-lg text-[#18534F] mb-1">
                  {option.title}
                </h3>
                <p className="text-[#718197] text-sm mb-4">
                  {option.description}
                </p>

                <div className="space-y-1">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div
                        className={`w-1.5 h-1.5 rounded-full me-2 ${
                          selectedOption === option.id
                            ? 'bg-[#D6955B]'
                            : 'bg-gray-300'
                        }`}
                      ></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Simple stat */}
        <div className="mb-6 p-4 bg-white/70 rounded-lg border border-[#718197]/10">
          <p className="text-center text-sm text-[#718197]">
            <Trans
              i18nKey="onboarding.memberStat"
              components={{ b: <span className="font-bold text-[#18534F]" /> }}
            />
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 border border-[#718197]/30 text-[#718197] rounded-lg
              hover:bg-white/50 transition flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            {t("onboarding.skip")}
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedOption || loading}
            className="flex-1 py-3 bg-gradient-to-r from-[#18534F] to-[#718197] text-white
              rounded-lg hover:shadow-lg transition disabled:opacity-50
              flex items-center justify-center gap-2"
          >
            {loading ? (
              'Loading...'
            ) : (
              <>
                {t("account.continue")}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Note */}
        <div className="mt-6 pt-4 border-t border-[#718197]/10">
          <p className="text-center text-xs text-[#718197]">
            {t("onboarding.youCanAlwaysChangeYourSettings")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Choix;
