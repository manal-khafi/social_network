import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Choix from "./Choix";
import SetupProfile from "./nameandimage";
import ChooseGender from "./gender";
import PrivacySettings from "./Privacy";
import { Check, Sparkles, Loader } from "lucide-react";
import { useAppDispatch } from "../../hooks";
import { setAuth } from "../../features/auth/authSlice";

const PersonalizationWizard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // État pour suivre l'étape actuelle
  const [currentStep, setCurrentStep] = useState<
    "choice" | "profile" | "gender" | "privacy" | "summary"
  >("choice");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour stocker toutes les données collectées
  const [allData, setAllData] = useState({
    accountChoice: null as "yes" | "no" | "skip" | null,
    profile: {
      username: "",
      profileImage: null as string | null,
      imageFile: null as File | null,
    },
    gender: null as string | null,
    privacy: {
      type: "public" as "public" | "private",
      isPublic: true,
      approvedFollowersOnly: false,
    },
  });

  // Suivre les étapes complétées
  const [completedSteps, setCompletedSteps] = useState<
    ("choice" | "profile" | "gender" | "privacy")[]
  >([]);

  // Types for step data
  type StepData =
    | { accountChoice: "yes" | "no" | "skip" }
    | {
        profile: {
          username: string;
          profileImage: string | null;
          imageFile: File | null;
        };
      }
    | { gender: string | null }
    | {
        privacy: {
          type: "public" | "private";
          isPublic: boolean;
          approvedFollowersOnly: boolean;
        };
      };

  // Fonction pour mettre à jour les données d'une étape
  const updateStepData = useCallback((step: string, data: StepData) => {
    console.log(`Mise à jour étape ${step}:`, data);

    setAllData((prev) => {
      const updatedData = { ...prev };

      switch (step) {
        case "choice":
          if ("accountChoice" in data) {
            updatedData.accountChoice = data.accountChoice;
          }
          break;
        case "profile":
          if ("profile" in data) {
            updatedData.profile = {
              ...prev.profile,
              ...data.profile,
            };
          }
          break;
        case "gender":
          if ("gender" in data) {
            updatedData.gender = data.gender;
          }
          break;
        case "privacy":
          if ("privacy" in data) {
            updatedData.privacy = {
              ...prev.privacy,
              ...data.privacy,
            };
          }
          break;
        default:
          break;
      }

      return updatedData;
    });

    // Marquer l'étape comme complétée
    setCompletedSteps((prev) => {
      const stepId = step as "choice" | "profile" | "gender" | "privacy";
      if (!prev.includes(stepId)) {
        return [...prev, stepId];
      }
      return prev;
    });
  }, []);

  // Memoized callback for profile updates to prevent infinite loop
  const handleProfileUpdate = useCallback(
    (data: {
      username: string;
      profileImage: string | null;
      imageFile: File | null;
    }) => {
      console.log("Données profil reçues:", data);
      updateStepData("profile", { profile: data });
    },
    [updateStepData]
  );

  // Navigation entre les étapes
  const nextStep = () => {
    console.log(`Passage de ${currentStep} à l'étape suivante`);

    switch (currentStep) {
      case "choice":
        if (allData.accountChoice === "yes") {
          setCurrentStep("profile");
        } else if (
          allData.accountChoice === "no" ||
          allData.accountChoice === "skip"
        ) {
          handleSkipToHome();
        }
        break;
      case "profile":
        setCurrentStep("gender");
        break;
      case "gender":
        setCurrentStep("privacy");
        break;
      case "privacy":
        setCurrentStep("summary");
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    console.log(`Retour de ${currentStep} à l'étape précédente`);

    switch (currentStep) {
      case "profile":
        setCurrentStep("choice");
        break;
      case "gender":
        setCurrentStep("profile");
        break;
      case "privacy":
        setCurrentStep("gender");
        break;
      case "summary":
        setCurrentStep("privacy");
        break;
      default:
        break;
    }
  };

  // Fonction pour passer directement à l'accueil
  const handleSkipToHome = () => {
    console.log("Sauter vers la page d'accueil");

    const defaultData = {
      accountChoice: "skip",
      profile: {
        username: "",
        profileImage: "default",
        imageFile: null,
      },
      gender: null,
      privacy: {
        type: "public",
        isPublic: true,
        approvedFollowersOnly: false,
      },
    };

    localStorage.setItem("userSetupData", JSON.stringify(defaultData));
    navigate("/home");
  };

  const submitAllDataToBackend = async () => {
    setIsSubmitting(true);

    try {
      console.log("=== DÉBUT ENVOI ===");
      console.log("Données complètes:", allData);

      if (!allData.profile.username) {
        throw new Error("Le nom d'utilisateur est requis");
      }

      // 1. Construire les données JSON PROPRES
      const jsonData = {
        accountSetup: {
          choice: allData.accountChoice,
          timestamp: new Date().toISOString(),
        },
        profile: {
          username: allData.profile.username,
          displayName: allData.profile.username,
          bio: "",
          gender: allData.gender,
        },
        privacy: allData.privacy,
        completedSteps: completedSteps,
      };

      console.log("JSON Data à envoyer:", JSON.stringify(jsonData, null, 2));
      const formData = new FormData();
      console.log(jsonData);
      formData.append("userData", JSON.stringify(jsonData));
      console.log(formData);
      console.log("userData ajouté au FormData");

      // 4. Ajouter l'image si elle existe
      if (allData.profile.imageFile) {
        console.log("Fichier image détecté:", {
          name: allData.profile.imageFile.name,
          type: allData.profile.imageFile.type,
          size: `${(allData.profile.imageFile.size / 1024).toFixed(2)} KB`,
        });
        formData.append("profileImage", allData.profile.imageFile);
        console.log("Fichier ajouté au FormData");
      } else if (
        allData.profile.profileImage &&
        allData.profile.profileImage !== "default"
      ) {
        if (allData.profile.profileImage.startsWith("data:image")) {
          const base64Data = allData.profile.profileImage.split(",")[1];
          console.log("Image base64 détectée, longueur:", base64Data.length);
          formData.append("profileImageBase64", base64Data);
          console.log("Base64 ajouté au FormData");
        }
      }

      // 5. Vérifier le contenu de FormData (méthode alternative)
      console.log("=== VÉRIFICATION FORM DATA ===");
      console.log("formData a userData?", formData.has("userData"));
      console.log("formData a profileImage?", formData.has("profileImage"));
      console.log(
        "formData a profileImageBase64?",
        formData.has("profileImageBase64")
      );
      const entries: string[] = [];
      for (const pair of formData.entries()) {
        const [key, value] = pair;
        if (key === "userData" && typeof value === "string") {
          entries.push(`${key}: JSON (${value.length} caractères)`);
        } else if (key === "profileImage" && value instanceof File) {
          entries.push(`${key}: Fichier - ${value.name}`);
        } else if (key === "profileImageBase64" && typeof value === "string") {
          entries.push(`${key}: Base64 (${value.length} caractères)`);
        }
      }
      console.log("Entrées FormData:", entries);
      console.log("=== ENVOI AU BACKEND ===");
      console.log(formData);
      console.log("URL:", "http://localhost:3500/api/Compte/update/profile");

      // Get auth token from localStorage
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      try {
        console.log("form data", formData);
        const response = await fetch(
          "http://localhost:3500/api/Compte/update/profile",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        console.log("=== RÉPONSE ===");
        console.log("Status:", response.status, response.statusText);
        console.log("OK?", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erreur du serveur:", errorText);

          // Essayer de parser comme JSON si possible
          try {
            const errorJson = JSON.parse(errorText);
            console.error("Erreur JSON:", errorJson);
            throw new Error(
              `Erreur ${response.status}: ${
                errorJson.message || response.statusText
              }`
            );
          } catch {
            throw new Error(
              `Erreur ${response.status}: ${response.statusText} - ${errorText}`
            );
          }
        }

        const result = await response.json();
        console.log("Réponse JSON:", result);

        // ✅ CRITICAL FIX: Save user object and dispatch Redux action
        if (result.token && result.user) {
          // Save user object to localStorage (required by authSlice)
          localStorage.setItem("user", JSON.stringify(result.user));
          localStorage.setItem("authToken", result.token);
          localStorage.setItem("token", result.token); // backward compatibility

          // ✅ CRITICAL: Dispatch Redux action to update auth state
          dispatch(
            setAuth({
              user: result.user,
              token: result.token,
            })
          );
        }

        console.log("=== SAUVEGARDE LOCALE ===");
        localStorage.setItem(
          "userProfile",
          JSON.stringify({
            username: allData.profile.username,
            profileImage: allData.profile.profileImage,
            gender: allData.gender,
            privacy: allData.privacy,
            isSetupComplete: true,
          })
        );

        // Nettoyer
        localStorage.removeItem("setupWizardData");

        // ✅ FIX: Use window.location to force full page re-render
        // This ensures App.tsx re-evaluates routes with updated Redux state
        // Small delay to ensure Redux state has propagated
        setTimeout(() => {
          window.location.href = "/home";
        }, 100);
      } catch (fetchError: unknown) {
        console.error("=== ERREUR FETCH ===");
        const error = fetchError as Error;
        console.error("Type:", error.name);
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);

        // Vérifier si c'est une erreur réseau/CORS
        if (
          error.name === "TypeError" &&
          error.message.includes("Failed to fetch")
        ) {
          throw new Error(
            "Impossible de se connecter au serveur. Vérifiez que le backend est en marche sur http://localhost:3500"
          );
        }
        throw fetchError;
      }
    } catch (error: unknown) {
      console.error("=== ERREUR FINALE ===");
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création du compte.";
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      console.log("=== FIN ENVOI ===");
    }
  };
  // Sauvegarder les données dans localStorage (sans le fichier image)
  useEffect(() => {
    const saveData = {
      currentStep,
      allData: {
        ...allData,
        profile: {
          username: allData.profile.username,
          profileImage: allData.profile.profileImage,
          imageFile: null, // Ne pas sauvegarder le File
        },
      },
      completedSteps,
    };

    localStorage.setItem("setupWizardData", JSON.stringify(saveData));
  }, [currentStep, allData, completedSteps]);

  // Charger les données depuis localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("setupWizardData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as {
          currentStep?: "choice" | "profile" | "gender" | "privacy" | "summary";
          allData?: typeof allData;
          completedSteps?: ("choice" | "profile" | "gender" | "privacy")[];
        };
        console.log("Données chargées depuis localStorage:", parsedData);

        if (parsedData.currentStep) {
          setCurrentStep(parsedData.currentStep);
        }

        if (parsedData.allData) {
          // Restaurer les données, mais garder imageFile à null
          setAllData({
            ...parsedData.allData,
            profile: {
              ...parsedData.allData.profile,
              imageFile: null, // Toujours null après restauration
            },
          });
        }

        if (parsedData.completedSteps) {
          setCompletedSteps(parsedData.completedSteps);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    }
  }, []);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "choice":
        return (
          <Choix
            onSelect={(choice) => {
              console.log("Choix reçu:", choice);
              updateStepData("choice", { accountChoice: choice });
              if (choice === "no" || choice === "skip") {
                handleSkipToHome();
              } else {
                setTimeout(() => nextStep(), 300);
              }
            }}
            onSkip={handleSkipToHome}
          />
        );
      case "profile":
        return (
          <div>
            <SetupProfile
              onUpdate={handleProfileUpdate}
              onSkip={() => {
                console.log("Skipping profile step");
                nextStep();
              }}
              onBack={() => {
                console.log("Retour depuis profile");
                prevStep();
              }}
              initialData={{
                username: allData.profile.username,
                profileImage: allData.profile.profileImage,
              }}
            />
          </div>
        );
      case "gender":
        return (
          <div>
            <ChooseGender
              onSelect={(gender) => {
                console.log("Genre reçu:", gender);
                updateStepData("gender", { gender });
                setTimeout(() => nextStep(), 300);
              }}
              onSkip={() => {
                console.log("Skipping gender step");
                nextStep();
              }}
              onBack={() => {
                console.log("Retour depuis gender");
                prevStep();
              }}
              selectedValue={allData.gender}
            />
          </div>
        );
      case "privacy":
        return (
          <div>
            <PrivacySettings
              onSelect={(privacy) => {
                console.log("Confidentialité reçue:", privacy);
                updateStepData("privacy", { privacy });
              }}
              onSkip={() => {
                console.log("Skipping privacy step");
                nextStep();
              }}
              onBack={() => {
                console.log("Retour depuis privacy");
                prevStep();
              }}
              onComplete={() => {
                console.log("Confidentialité complète, aller au récapitulatif");
                setCurrentStep("summary");
              }}
              selectedValue={allData.privacy}
            />
          </div>
        );
      case "summary":
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
                  <h3 className="font-semibold text-[#18534F] mb-3">
                    👤 Ton Profil
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">Nom d'utilisateur:</span>
                      <span className="font-medium text-[#18534F]">
                        @{allData.profile.username || "non défini"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">Photo:</span>
                      <span className="font-medium text-[#18534F]">
                        {allData.profile.profileImage &&
                        allData.profile.profileImage !== "default"
                          ? "✓ Définie"
                          : "✗ Par défaut"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">
                    ⚧️ Genre
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">Choix:</span>
                    <span className="font-medium text-[#18534F]">
                      {allData.gender === "male"
                        ? "Homme ♂"
                        : allData.gender === "female"
                        ? "Femme ♀"
                        : allData.gender === "prefer_not_say"
                        ? "Ne pas dire 🔒"
                        : "Non spécifié"}
                    </span>
                  </div>
                </div>
                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">
                    🔒 Confidentialité
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">Type de compte:</span>
                    <span
                      className={`font-medium ${
                        allData.privacy.type === "public"
                          ? "text-[#18534F]"
                          : "text-[#D6955B]"
                      }`}
                    >
                      {allData.privacy.type === "public"
                        ? "Public 🌐"
                        : "Privé 🔒"}
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
                  onClick={() => setCurrentStep("privacy")}
                  className="w-full py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
                    hover:bg-gray-50 transition"
                >
                  Modifier les informations
                </button>
              </div>

              {!allData.profile.username && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm text-center">
                    ⚠️ Tu dois définir un nom d'utilisateur pour créer ton
                    compte
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
      { id: "choice", label: "Choix", icon: "⚡" },
      { id: "profile", label: "Profil", icon: "👤" },
      { id: "gender", label: "Genre", icon: "⚧️" },
      { id: "privacy", label: "Confidentialité", icon: "🔒" },
      { id: "summary", label: "Finaliser", icon: "🎯" },
    ];

    const currentIndex = steps.findIndex((step) => step.id === currentStep);

    return (
      <div className="mb-8 px-4">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const stepId = step.id as
              | "choice"
              | "profile"
              | "gender"
              | "privacy";
            const isCompleted =
              completedSteps.includes(stepId) || index < currentIndex;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isActive ? "scale-110" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-lg
                  ${
                    isCompleted
                      ? "bg-[#18534F] text-white"
                      : isActive
                      ? "bg-white border-2 border-[#18534F] text-[#18534F]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted && step.id !== "summary" ? "✓" : step.icon}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-[#18534F]" : "text-gray-400"
                  }`}
                >
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

  if (currentStep === "choice" || currentStep === "summary") {
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
