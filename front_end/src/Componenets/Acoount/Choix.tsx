import React, { useState } from 'react';
import { Check, SkipForward, ArrowRight, User, Settings } from 'lucide-react';

interface ChoixProps {
  onSelect: (choice: 'yes' | 'no' | 'skip') => void;
  onSkip: () => void;
}

const Choix: React.FC<ChoixProps> = ({ onSelect, onSkip }) => {
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);
  const [loading, setLoading] = useState(false);

  const options = [
    {
      id: 'yes',
      title: 'Crée ton style',
      description: 'Personnalise ton profil avec ta photo et tes infos',
      icon: <User className="w-6 h-6" />,
      features: ['Photo de profil', 'Nom unique', 'Privacité', 'Tes préférences']
    },
    {
      id: 'no',
      title: 'Plus tard',
      description: 'Commencer avec les réglages de base',
      icon: <Settings className="w-6 h-6" />,
      features: ['Profil par défaut', 'Modifiable après', 'Simple rapide']
    }
  ];

  const handleContinue = async () => {
    if (!selectedOption) return;

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Envoyer le choix au parent via la prop onSelect
      onSelect(selectedOption);
      
      // Note: La navigation est maintenant gérée par le parent (PersonalizationWizard)
      // Le parent décidera quoi faire avec le choix
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Envoyer 'skip' au parent
    onSelect('skip');
    // Appeler la fonction onSkip du parent
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
            Veux-tu créer ton profil maintenant ?
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
              <div className="text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    option.id === 'yes' ? 'bg-[#ECF8F6]' : 'bg-gray-100'
                  }`}>
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
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        selectedOption === option.id ? 'bg-[#D6955B]' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Statistique simple */}
        <div className="mb-6 p-4 bg-white/70 rounded-lg border border-[#718197]/10">
          <p className="text-center text-sm text-[#718197]">
            <span className="font-bold text-[#18534F]">80%</span> des membres personnalisent leur profil
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
              hover:bg-white/50 transition flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Passer
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedOption || loading}
            className="flex-1 py-3 bg-gradient-to-r from-[#18534F] to-[#718197] text-white 
              rounded-lg hover:shadow-lg transition disabled:opacity-50 
              flex items-center justify-center gap-2"
          >
            {loading ? (
              'Chargement...'
            ) : (
              <>
                Continuer
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Note */}
        <div className="mt-6 pt-4 border-t border-[#718197]/10">
          <p className="text-center text-xs text-[#718197]">
            Tu peux toujours modifier tes paramètres plus tard ⚡
          </p>
        </div>
      </div>
    </div>
  );
};

export default Choix;