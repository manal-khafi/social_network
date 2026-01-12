import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Choix from './Choix';
import SetupProfile from './nameandimage';
import ChooseGender from './gender';
import PrivacySettings from './Privacy';
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader } from 'lucide-react';

const PersonalizationWizard: React.FC = () => {
  const navigate = useNavigate();
  
  // État pour suivre l'étape actuelle
  const [currentStep, setCurrentStep] = useState<'choice' | 'profile' | 'gender' | 'privacy' | 'summary'>('choice');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour stocker toutes les données collectées
  const [allData, setAllData] = useState({
    accountChoice: null as 'yes' | 'no' | 'skip' | null,
    profile: {
      username: '',
      profileImage: null as string | null,
      imageFile: null as File | null
    },
    gender: null as string | null,
    privacy: {
      type: 'public' as 'public' | 'private',
      isPublic: true,
      approvedFollowersOnly: false
    }
  });

  // Suivre les étapes complétées
  const [completedSteps, setCompletedSteps] = useState<('choice' | 'profile' | 'gender' | 'privacy')[]>([]);

  // Fonction pour mettre à jour les données d'une étape
  const updateStepData = (step: string, data: any) => {
    console.log(`Mise à jour étape ${step}:`, data);
    
    setAllData(prev => {
      let updatedData = { ...prev };
      
      switch (step) {
        case 'choice':
          updatedData.accountChoice = data.accountChoice;
          break;
        case 'profile':
          updatedData.profile = { 
            ...prev.profile, 
            ...data.profile 
          };
          break;
        case 'gender':
          updatedData.gender = data.gender;
          break;
        case 'privacy':
          updatedData.privacy = { 
            ...prev.privacy, 
            ...data.privacy 
          };
          break;
        default:
          break;
      }
      
      return updatedData;
    });

    // Marquer l'étape comme complétée
    if (!completedSteps.includes(step as any)) {
      setCompletedSteps(prev => [...prev, step as any]);
    }
  };

  // Navigation entre les étapes
  const nextStep = () => {
    console.log(`Passage de ${currentStep} à l'étape suivante`);
    
    switch (currentStep) {
      case 'choice':
        if (allData.accountChoice === 'yes') {
          setCurrentStep('profile');
        } else if (allData.accountChoice === 'no' || allData.accountChoice === 'skip') {
          handleSkipToHome();
        }
        break;
      case 'profile':
        setCurrentStep('gender');
        break;
      case 'gender':
        setCurrentStep('privacy');
        break;
      case 'privacy':
        setCurrentStep('summary');
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    console.log(`Retour de ${currentStep} à l'étape précédente`);
    
    switch (currentStep) {
      case 'profile':
        setCurrentStep('choice');
        break;
      case 'gender':
        setCurrentStep('profile');
        break;
      case 'privacy':
        setCurrentStep('gender');
        break;
      case 'summary':
        setCurrentStep('privacy');
        break;
      default:
        break;
    }
  };
  const handleSkipToHome = () => {
    console.log('Sauter vers la page d\'accueil');
    
    const defaultData = {
      accountChoice: 'skip',
      profile: {
        username: '',
        profileImage: 'default',
        imageFile: null
      },
      gender: null,
      privacy: {
        type: 'public',
        isPublic: true,
        approvedFollowersOnly: false
      }
    };
    
    localStorage.setItem('userSetupData', JSON.stringify(defaultData));
    navigate('/home');
  };
const submitAllDataToBackend = async () => {
  setIsSubmitting(true);

  try {
    console.log('=== DÉBUT ENVOI ===');
    
    if (!allData.profile.username) {
      throw new Error('Le nom d\'utilisateur est requis');
    }

    // 1. Construire les données JSON
    const jsonData = {
      accountSetup: {
        choice: allData.accountChoice,
        timestamp: new Date().toISOString()
      },
      profile: {
        username: allData.profile.username,
        displayName: allData.profile.username,
        bio: '',
        gender: allData.gender
      },
      privacy: allData.privacy,
      completedSteps: completedSteps
    };
    
    console.log('JSON Data:', jsonData);
    
    // 2. Créer FormData CORRECTEMENT
    const formData = new FormData();
    
    // 3. Ajouter userData (IMPORTANT: utiliser Blob pour JSON)
    const userDataBlob = new Blob([JSON.stringify(jsonData)], {
      type: 'application/json'
    });
    formData.append('userData', userDataBlob, 'userData.json');
    
    console.log('✅ userData ajouté comme Blob');
    
    // 4. Ajouter l'image SI elle existe
    if (allData.profile.imageFile) {
      const file = allData.profile.imageFile;
      console.log('📸 Fichier image:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      formData.append('profileImage', file, file.name);
      console.log('✅ Fichier ajouté au FormData');
    } else if (allData.profile.profileImage && allData.profile.profileImage !== 'default') {
      if (allData.profile.profileImage.startsWith('data:image')) {
        // Convertir base64 en Blob
        const base64Response = await fetch(allData.profile.profileImage);
        const blob = await base64Response.blob();
        formData.append('profileImage', blob, 'profile.png');
        console.log('✅ Image base64 convertie en Blob et ajoutée');
      }
    }

    // 5. DEBUG: Afficher FormData (méthode correcte)
    console.log('=== DEBUG FORM DATA ===');
    console.log('FormData créé, nombre d\'entrées:', Array.from(formData.entries()).length);
    
    // Parcourir FormData pour vérifier
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
      } else if (value instanceof Blob) {
        console.log(`${key}: Blob - ${value.type} (${value.size} bytes)`);
      } else {
        console.log(`${key}: ${typeof value} - ${value}`);
      }
    }
    
    // 6. TEST: Vérifier d'abord que le backend est accessible
    console.log('=== TEST DE CONNEXION BACKEND ===');
    try {
      const testResponse = await fetch('http://localhost:3500/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      console.log('Test backend - Status:', testResponse.status);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Backend accessible:', testData);
      } else {
        throw new Error(`Backend ne répond pas correctement: ${testResponse.status}`);
      }
    } catch (testError: any) {
      console.error('❌ Backend inaccessible:', testError.message);
      // Continuer quand même - peut-être que l'endpoint existe
    }
    
    // 7. Envoyer la requête avec XMLHttpRequest (plus fiable pour FormData)
    console.log('=== ENVOI AVEC XMLHttpRequest ===');
    
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', 'http://localhost:3500/api/Compte/update/profile');
      
      xhr.onload = function() {
        console.log('=== RÉPONSE XHR ===');
        console.log('Status:', xhr.status, xhr.statusText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('✅ Réponse JSON:', result);
            
            // Sauvegarder localement
            localStorage.setItem('userProfile', JSON.stringify({
              username: allData.profile.username,
              profileImage: allData.profile.profileImage,
              gender: allData.gender,
              privacy: allData.privacy,
              isSetupComplete: true
            }));
            
            if (result.token) {
              localStorage.setItem('authToken', result.token);
            }
            
            localStorage.removeItem('setupWizardData');
            
            navigate('/home', { 
              state: { 
                welcomeMessage: `Bienvenue ${allData.profile.username} !`,
                setupComplete: true
              } 
            });
            
            resolve();
          } catch (parseError) {
            console.error('❌ Erreur parsing réponse:', parseError);
            console.error('Response text:', xhr.responseText);
            reject(new Error('Réponse invalide du serveur'));
          }
        } else {
          console.error('❌ Erreur XHR:', xhr.status, xhr.statusText);
          console.error('Response:', xhr.responseText);
          reject(new Error(`Erreur ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function() {
        console.error('❌ ERREUR RÉSEAU XHR');
        reject(new Error('Erreur réseau - Vérifiez CORS et connexion serveur'));
      };
      
      xhr.ontimeout = function() {
        console.error('❌ TIMEOUT XHR');
        reject(new Error('Timeout - Le serveur ne répond pas'));
      };
      
      xhr.timeout = 30000;
      
      // Événement progression upload
      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          console.log(`📤 Upload: ${percent.toFixed(1)}%`);
        }
      };
      
      console.log('🚀 Envoi de la requête XHR...');
      xhr.send(formData);
    });
    
  } catch (error: any) {
    console.error('❌ ERREUR FINALE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Solution de secours : mode local
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('Erreur réseau')) {
      
      const useLocalMode = confirm(
        'Le serveur backend n\'est pas accessible.\n\n' +
        'Voulez-vous continuer en mode local (données sauvegardées dans le navigateur)?'
      );
      
      if (useLocalMode) {
        // Mode local
        localStorage.setItem('userProfile', JSON.stringify({
          username: allData.profile.username,
          profileImage: allData.profile.profileImage,
          gender: allData.gender,
          privacy: allData.privacy,
          isSetupComplete: true
        }));
        
        localStorage.setItem('authToken', 'local-token-' + Date.now());
        localStorage.removeItem('setupWizardData');
        
        navigate('/home', { 
          state: { 
            welcomeMessage: `Bienvenue ${allData.profile.username} ! (Mode local)`,
            setupComplete: true,
            localMode: true
          } 
        });
        return;
      }
    }
    
    alert(`Erreur: ${error.message}\n\nVeuillez vérifier que le serveur backend est en marche.`);
  } finally {
    setIsSubmitting(false);
    console.log('=== FIN ENVOI ===');
  }
};



  useEffect(() => {
    const saveData = {
      currentStep,
      allData: {
        ...allData,
        profile: {
          username: allData.profile.username,
          profileImage: allData.profile.profileImage,
          imageFile: null
        }
      },
      completedSteps
    };
    
    localStorage.setItem('setupWizardData', JSON.stringify(saveData));
  }, [currentStep, allData, completedSteps]);

  // Charger les données depuis localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('setupWizardData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Données chargées depuis localStorage:', parsedData);
        
        if (parsedData.currentStep) {
          setCurrentStep(parsedData.currentStep);
        }
        
        if (parsedData.allData) {
          // Restaurer les données, mais garder imageFile à null
          setAllData({
            ...parsedData.allData,
            profile: {
              ...parsedData.allData.profile,
              imageFile: null // Toujours null après restauration
            }
          });
        }
        
        if (parsedData.completedSteps) {
          setCompletedSteps(parsedData.completedSteps);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
  }, []);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'choice':
        return (
          <Choix 
            onSelect={(choice) => {
              console.log('Choix reçu:', choice);
              updateStepData('choice', { accountChoice: choice });
              if (choice === 'no' || choice === 'skip') {
                handleSkipToHome();
              } else {
                setTimeout(() => nextStep(), 300);
              }
            }}
            onSkip={handleSkipToHome}
          />
        );
      case 'profile':
        return (
          <div>
            <SetupProfile 
              onUpdate={(data) => {
                console.log('Données profil reçues:', data);
                updateStepData('profile', { profile: data });
              }}
              onSkip={() => {
                console.log('Skipping profile step');
                nextStep();
              }}
              onBack={() => {
                console.log('Retour depuis profile');
                prevStep();
              }}
              initialData={{
                username: allData.profile.username,
                profileImage: allData.profile.profileImage,
                imageFile: allData.profile.imageFile
              }}
            />
          </div>
        );
      case 'gender':
        return (
          <div>
            <ChooseGender 
              onSelect={(gender) => {
                console.log('Genre reçu:', gender);
                updateStepData('gender', { gender });
                setTimeout(() => nextStep(), 300);
              }}
              onSkip={() => {
                console.log('Skipping gender step');
                nextStep();
              }}
              onBack={() => {
                console.log('Retour depuis gender');
                prevStep();
              }}
              selectedValue={allData.gender}
            />
          </div>
        );
      case 'privacy':
        return (
          <div>
            <PrivacySettings 
              onSelect={(privacy) => {
                console.log('Confidentialité reçue:', privacy);
                updateStepData('privacy', { privacy });
              }}
              onSkip={() => {
                console.log('Skipping privacy step');
                nextStep();
              }}
              onBack={() => {
                console.log('Retour depuis privacy');
                prevStep();
              }}
              onComplete={() => {
                console.log('Confidentialité complète, aller au récapitulatif');
                setCurrentStep('summary');
              }}
              selectedValue={allData.privacy}
            />
          </div>
        );
      case 'summary':
        return (
          <div className="min-h-screen bg-[#ECF8F6] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-[#ECF8F6] rounded-full mb-6">
                  <Sparkles className="w-10 h-10 text-[#18534F]" />
                </div>
                <h1 className="text-2xl font-bold text-[#18534F] mb-3">
                  Récapitulatif
                </h1>
                <p className="text-[#718197]">
                  Vérifie tes informations avant de finaliser
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">👤 Ton Profil</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">Nom d'utilisateur:</span>
                      <span className="font-medium text-[#18534F]">
                        @{allData.profile.username || 'non défini'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">Photo:</span>
                      <span className="font-medium text-[#18534F]">
                        {allData.profile.profileImage && allData.profile.profileImage !== 'default' 
                          ? '✓ Définie' 
                          : '✗ Par défaut'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">⚧️ Genre</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">Choix:</span>
                    <span className="font-medium text-[#18534F]">
                      {allData.gender === 'male' ? 'Homme ♂' : 
                       allData.gender === 'female' ? 'Femme ♀' : 
                       allData.gender === 'prefer_not_say' ? 'Ne pas dire 🔒' : 
                       'Non spécifié'}
                    </span>
                  </div>
                </div>
                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">🔒 Confidentialité</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">Type de compte:</span>
                    <span className={`font-medium ${allData.privacy.type === 'public' ? 'text-[#18534F]' : 'text-[#D6955B]'}`}>
                      {allData.privacy.type === 'public' ? 'Public 🌐' : 'Privé 🔒'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={submitAllDataToBackend}
                  disabled={isSubmitting || !allData.profile.username}
                  className="w-full py-3 bg-gradient-to-r from-[#18534F] to-[#718197] text-white 
                    rounded-lg hover:shadow-lg transition disabled:opacity-50 
                    flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Création du compte...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCurrentStep('privacy')}
                  className="w-full py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
                    hover:bg-gray-50 transition"
                >
                  Modifier les informations
                </button>
              </div>
              
              {!allData.profile.username && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm text-center">
                    ⚠️ Tu dois définir un nom d'utilisateur pour créer ton compte
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const ProgressBar = () => {
    const steps = [
      { id: 'choice', label: 'Choix', icon: '⚡' },
      { id: 'profile', label: 'Profil', icon: '👤' },
      { id: 'gender', label: 'Genre', icon: '⚧️' },
      { id: 'privacy', label: 'Confidentialité', icon: '🔒' },
      { id: 'summary', label: 'Finaliser', icon: '🎯' }
    ];

    const currentIndex = steps.findIndex(step => step.id === currentStep);

    return (
      <div className="mb-8 px-4">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.includes(step.id as any) || index < currentIndex;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-lg
                  ${isCompleted ? 'bg-[#18534F] text-white' : 
                    isActive ? 'bg-white border-2 border-[#18534F] text-[#18534F]' : 
                    'bg-gray-100 text-gray-400'}`}
                >
                  {isCompleted && step.id !== 'summary' ? '✓' : step.icon}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-[#18534F]' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#18534F] to-[#718197] transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (currentStep === 'choice' || currentStep === 'summary') {
    return renderCurrentStep();
  }

  return (
    <div className="min-h-screen bg-[#ECF8F6]">
      <div className="container mx-auto px-4 py-8">
        <ProgressBar />
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default PersonalizationWizard;