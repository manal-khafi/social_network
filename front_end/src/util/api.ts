// frontend/src/utils/api.ts

export const socialLoginBackend = async (idToken: string, provider: "google" | "facebook") => {
  const response = await fetch("http://localhost:3500/api/authentification/social-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken, provider }),
  });

  if (!response.ok) throw new Error("Failed to authenticate with backend");

  return await response.json();
};
