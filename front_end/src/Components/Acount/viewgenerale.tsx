import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Choix from "./choice";
import SetupProfile from "./nameandimage";
import ChooseGender from "./gender";
import PrivacySettings from "./privacy";
import { Check, Sparkles, Loader } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchMe, setAuth } from "../../features/auth/authSlice";
import api from "../../api/axios";
import { toast } from "sonner";

type Step = "choice" | "profile" | "gender" | "privacy" | "summary";

const PersonalizationWizard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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

  const handleSkipToHome = async () => {
    try {
      const response = await api.patch("/authentication/onboarding/complete");
      if (response.data.token && response.data.user) {
        dispatch(setAuth({ token: response.data.token, user: response.data.user }));
      } else {
        await dispatch(fetchMe());
      }
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
        throw new Error("Username is required");
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
        },
        privacy: allData.privacy,
        completedSteps: completedSteps,
      };

      const formData = new FormData();
      formData.append("userData", JSON.stringify(jsonData));

      if (allData.profile.imageFile) {
        formData.append("profileImage", allData.profile.imageFile);
      } else if (
        allData.profile.profileImage &&
        allData.profile.profileImage !== "default" &&
        allData.profile.profileImage.startsWith("data:image")
      ) {
        const base64Data = allData.profile.profileImage.split(",")[1];
        formData.append("profileImageBase64", base64Data);
      }

      const response = await api.post("/Compte/update/profile", formData);
      const result = response.data;

      console.log("JSON response:", result);

      const completeResponse = await api.patch("/authentication/onboarding/complete");
      if (completeResponse.data.token && completeResponse.data.user) {
        dispatch(setAuth({ token: completeResponse.data.token, user: completeResponse.data.user }));
      } else {
        await dispatch(fetchMe());
      }

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
                  Summary
                </h1>
                <p className="text-[#718197]">
                  Review your info before finishing
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">
                    👤 Your Profile
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">Username:</span>
                      <span className="font-medium text-[#18534F]">
                        @{allData.profile.username || authUsername || "not set"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#718197]">Photo:</span>
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
                  <h3 className="font-semibold text-[#18534F] mb-3">⚧️ Gender</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">Choice:</span>
                    <span className="font-medium text-[#18534F]">
                      {allData.gender === "male"
                        ? "Male ♂"
                        : allData.gender === "female"
                        ? "Female ♀"
                        : allData.gender === "prefer_not_say"
                        ? "Prefer not to say 🔒"
                        : "Not specified"}
                    </span>
                  </div>
                </div>

                <div className="border border-[#718197]/20 rounded-xl p-4">
                  <h3 className="font-semibold text-[#18534F] mb-3">
                    🔒 Privacy
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#718197]">Account type:</span>
                    <span
                      className={`font-medium ${
                        allData.privacy.type === "public"
                          ? "text-[#18534F]"
                          : "text-[#D6955B]"
                      }`}
                    >
                      {allData.privacy.type === "public"
                        ? "Public 🌐"
                        : "Private 🔒"}
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create my account
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCurrentStep("privacy")}
                  className="w-full py-3 border border-[#718197]/30 text-[#718197] rounded-lg 
                    hover:bg-gray-50 transition"
                >
                  Edit information
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
      { id: "choice", label: "Choice", icon: "⚡" },
      { id: "profile", label: "Profile", icon: "👤" },
      { id: "gender", label: "Gender", icon: "⚧️" },
      { id: "privacy", label: "Privacy", icon: "🔒" },
      { id: "summary", label: "Finish", icon: "🎯" },
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
