import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Lock, Sparkles } from 'lucide-react';

interface ChooseGenderProps {
  onSelect: (gender: string | null) => void;
  onSkip: () => void;
  onBack: () => void;
  selectedValue?: string | null;
}

const ChooseGender: React.FC<ChooseGenderProps> = ({
  onSelect,
  onSkip,
  onBack,
  selectedValue,
}) => {
  const [selectedGender, setSelectedGender] = useState<string | null>(
    selectedValue || null
  );
  const [loading, setLoading] = useState(false);

  const genderOptions = [
    {
      id: 'male',
      label: 'Male',
      icon: '♂',
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      borderColor: 'border-blue-300',
    },
    {
      id: 'female',
      label: 'Female',
      icon: '♀',
      color: 'from-pink-400 to-rose-500',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
      borderColor: 'border-pink-300',
    },
    {
      id: 'prefer_not_say',
      label: 'Prefer not to say',
      icon: <Lock className="w-6 h-6" />,
      color: 'from-[#718197] to-[#18534F]',
      bgColor: 'bg-gradient-to-br from-gray-50 to-[#ECF8F6]',
      borderColor: 'border-[#718197]',
    },
  ];

  const handleContinue = async () => {
    if (!selectedGender) return;

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Send selected gender to parent
      onSelect(selectedGender === 'prefer_not_say' ? null : selectedGender);

      // Navigation is handled by the parent
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Send null to indicate "not specified"
    onSelect(null);
    onSkip();
  };

  const handleGenderSelect = (genderId: string) => {
    setSelectedGender(genderId);
  };

  return (
    <div className="min-h-screen bg-[#ECF8F6] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[#718197]">
            Choose how you want to be identified
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {genderOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleGenderSelect(option.id)}
              className={`w-full p-5 rounded-xl border-3 transition-all duration-200 ${
                selectedGender === option.id
                  ? `border-[#18534F] shadow-lg scale-[1.01]`
                  : 'border-[#718197]/30 hover:border-[#18534F]/50'
              } ${option.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold
                      ${
                        option.id === 'male'
                          ? 'bg-blue-100 text-blue-600'
                          : option.id === 'female'
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-[#ECF8F6] text-[#18534F]'
                      }`}
                  >
                    {typeof option.icon === 'string'
                      ? option.icon
                      : option.icon}
                  </div>

                  <div className="text-left">
                    <div className="font-bold text-lg text-[#18534F]">
                      {option.label}
                    </div>
                    <div className="text-sm text-[#718197]">
                      {option.id === 'prefer_not_say'
                        ? 'Keep this information private'
                        : 'For personalized recommendations'}
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedGender === option.id
                      ? 'border-[#18534F] bg-[#18534F]'
                      : 'border-[#718197]'
                  }`}
                >
                  {selectedGender === option.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
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
                Why do we ask this?
              </h4>
              <p className="text-sm text-[#718197]">
                To better tailor your experience on the platform.
                This information stays private and can be changed later.
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
            Skip
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedGender || loading}
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

export default ChooseGender;
