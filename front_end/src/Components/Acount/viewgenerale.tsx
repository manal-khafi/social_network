import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Choix from "./choice";
import SetupProfile from "./nameandimage";
import ChooseGender from "./gender";
import PrivacySettings from "./privacy";
import { Check, Sparkles, Loader } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchMe } from "../../features/auth/authSlice";
import { fetchCurrentUserProfile } from "../../features/user/userSlice";
import api from "../../api/axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { uploadFile } from "../../api/upload";

type Step = "choice" | "profile" | "gender" | "privacy" | "summary";

const PersonalizationWizard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = useAppSelector((state) => state.auth.token);

  // ✅ Read username from Redux (saved at register/login)
  const authUsername = useAppSelector((s) => s.auth.user?.username);

  const [currentStep, setCurrentStep] = useState<Step>("choice");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allData, setAllData] = useState(() => ({
    accountChoice: null as "yes" | "no" | "skip" | null,
    profile: {
      username: authUsername ?? "",
      profileImage: null as string | null,
      imageFile: null as File | null,
    },
    gender: null as string | null,
    privacy: {
      type: "public" as "public" | "private",
      isPublic: true,
      approvedFollowersOnly: false,
    },
  }));

  const [completedSteps, setCompletedSteps] = useState<
    ("choice" | "profile" | "gender" | "privacy")[]
  >([]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    if (authUsername) {
      setAllData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          username: prev.profile.username || authUsername,
        },
      }));
    }
  }, [authUsername]);

  const updateStepData = (step: string, data: any) => {
    setAllData((prev) => {
      const updated = { ...prev };

      switch (step) {
        case "choice":
          updated.accountChoice = data.accountChoice;
          break;
        case "profile":
          updated.profile = { ...prev.profile, ...data.profile };
          break;
        case "gender":
          updated.gender = data.gender;
          break;
        case "privacy":
          updated.privacy = { ...prev.privacy, ...data.privacy };
          break;
        default:
          break;
      }

      return updated;
    });

    if (!completedSteps.includes(step as any)) {
      setCompletedSteps((prev) => [...prev, step as any]);
    }
  };

  const nextStep = () => {
    switch (currentStep) {
      case "choice":
        if (allData.accountChoice === "yes") setCurrentStep("profile");
        if (allData.accountChoice === "no" || allData.accountChoice === "skip")
          handleSkipToHome();
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

  const dispatch = useAppDispatch();

  const handleSkipToHome = async () => {
    try {
      await api.patch("/authentication/onboarding/complete");
      dispatch(fetchMe());
      dispatch(fetchCurrentUserProfile());
      navigate("/home");
    } catch (error) {
      console.error("Failed to mark onboarding as complete", error);
      // Still navigate to home even if the API call fails
      navigate("/home");
    }
  };

  const submitAllDataToBackend = async () => {
    setIsSubmitting(true);

    try {
      // ✅ If user didn't type, use authUsername automatically
      const finalUsername = allData.profile.username || authUsername || "";

      if (!finalUsername) {
        throw new Error(t("onboarding.usernameIsRequired"));
      }

      // The picture was uploaded and saved when it was picked (see
      // nameandimage.tsx), so only its URL is sent. A draft restored from an
      // older session may still hold an inline image: upload it now.
      const picked = allData.profile.profileImage;
      let avatarUrl: string | null | undefined;
      if (picked?.startsWith("http")) {
        avatarUrl = picked;
      } else if (picked?.startsWith("data:image")) {
        const blob = await (await fetch(picked)).blob();
        avatarUrl = await uploadFile(blob, "avatars", "avatar.png");
      } else if (picked === "default") {
        avatarUrl = null; // removed during the wizard
      }

      const jsonData = {
        accountSetup: {
          choice: allData.accountChoice,
          timestamp: new Date().toISOString(),
        },
        profile: {
          username: finalUsername,
          displayName: finalUsername,
          bio: "",
          gender: allData.gender,
          // omitted when the picture was not touched, so an existing avatar
          // (e.g. from Google sign-in) is kept
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        privacy: allData.privacy,
        completedSteps: completedSteps,
      };

      const response = await api.post("/Compte/update/profile", {
        userData: JSON.stringify(jsonData),
      });
      const result = response.data;

      console.log("JSON response:", result);

      await api.patch("/authentication/onboarding/complete");
      dispatch(fetchMe());
      dispatch(fetchCurrentUserProfile());

      localStorage.removeItem("setupWizardData");

      navigate("/home", {
        state: {
          welcomeMessage: `Welcome ${finalUsername}!`,
          setupComplete: true,
        },
      });
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred.";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Save wizard progress to localStorage (without File)
  useEffect(() => {
    const saveData = {
      currentStep,
      allData: {
        ...allData,
        profile: {
          username: allData.profile.username,
          profileImage: allData.profile.profileImage,
          imageFile: null,
        },
      },
      completedSteps,
    };

    localStorage.setItem("setupWizardData", JSON.stringify(saveData));
  }, [currentStep, allData, completedSteps]);

  // ✅ Load wizard progress from localStorage (BUT do not overwrite username with empty)
  useEffect(() => {
    const savedData = localStorage.getItem("setupWizardData");
    if (!savedData) return;

    try {
      const parsedData = JSON.parse(savedData);

      if (parsedData.currentStep) setCurrentStep(parsedData.currentStep);

      if (parsedData.allData) {
        setAllData((prev) => ({
          ...parsedData.allData,
          profile: {
            ...parsedData.allData.profile,
            username:
              parsedData.allData.profile?.username ||
              prev.profile.username ||
              authUsername ||
              "",
            imageFile: null,
          },
        }));
      }

      if (parsedData.completedSteps) setCompletedSteps(parsedData.completedSteps);
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "choice":
        return (
          <Choix
            onSelect={(choice) => {
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
          <SetupProfile
            onUpdate={(data) => updateStepData("profile", { profile: data })}
            onSkip={() => nextStep()}
            onBack={() => prevStep()}
            initialData={{
              username: allData.profile.username || authUsername || "",
              profileImage: allData.profile.profileImage,
              imageFile: allData.profile.imageFile,
            }}
          />
        );

      case "gender":
        return (
          <ChooseGender
            onSelect={(gender) => {
              updateStepData("gender", { gender });
              setTimeout(() => nextStep(), 300);
            }}
            onSkip={() => nextStep()}
            onBack={() => prevStep()}
            selectedValue={allData.gender}
          />
        );

      case "privacy":
        return (
          <PrivacySettings
            onSelect={(privacy) => updateStepData("privacy", { privacy })}
            onSkip={() => nextStep()}
            onBack={() => prevStep()}
            onComplete={() => setCurrentStep("summary")}
            selectedValue={allData.privacy}
          />
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
                  {t("onboarding.summary")}
                </h1>
                <p className="text-[#718197]">
                  {t("onboarding.reviewYourInfoBeforeFinishing")}
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">
                    👤 Your Profile
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">{t("onboarding.username")}</span>
                      <span className="font-medium text-[#18534F]">
                        @{allData.profile.username || authUsername || "not set"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">{t("onboarding.photo")}</span>
                      <span className="font-medium text-[#18534F]">
                        {allData.profile.profileImage &&
                        allData.profile.profileImage !== "default"
                          ? "✓ Set"
                          : "✗ Default"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">{t("onboarding.gender")}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">{t("onboarding.choice")}</span>
                    <span className="font-medium text-[#18534F]">
                      {allData.gender === "male"
                        ? t("onboarding.male2")
                        : allData.gender === "female"
                        ? t("onboarding.female2")
                        : allData.gender === "prefer_not_say"
                        ? t("onboarding.preferNotToSay2")
                        : t("onboarding.notSpecified")}
                    </span>
                  </div>
                </div>

                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">
                    🔒 Privacy
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">{t("onboarding.accountType")}</span>
                    <span
                      className={`font-medium ${
                        allData.privacy.type === "public"
                          ? "text-[#18534F]"
                          : "text-[#D6955B]"
                      }`}
                    >
                      {allData.privacy.type === "public"
                        ? t("onboarding.public")
                        : t("onboarding.private")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={submitAllDataToBackend}
                  disabled={isSubmitting || !(allData.profile.username || authUsername)}
                  className="w-full py-3 bg-gradient-to-r from-[#18534F] to-[#718197] text-white 
                    rounded-lg hover:shadow-lg transition disabled:opacity-50 
                    flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {t("onboarding.creatingAccount")}
                    </>
                  ) : (
                    <>
                      {t("onboarding.createMyAccount")}
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCurrentStep("privacy")}
                  className="w-full py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
                    hover:bg-gray-50 transition"
                >
                  {t("onboarding.editInformation")}
                </button>
              </div>

              {!(allData.profile.username || authUsername) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm text-center">
                    ⚠️ You must set a username to create your account
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
      { id: "choice", label: t("onboarding.choice2"), icon: "⚡" },
      { id: "profile", label: t("nav.profile"), icon: "👤" },
      { id: "gender", label: t("onboarding.gender2"), icon: "⚧️" },
      { id: "privacy", label: t("settings.privacy"), icon: "🔒" },
      { id: "summary", label: t("onboarding.finish"), icon: "🎯" },
    ];

    const currentIndex = steps.findIndex((step) => step.id === currentStep);

    return (
      <div className="mb-8 px-4">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted =
              completedSteps.includes(step.id as any) || index < currentIndex;

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
          />
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
