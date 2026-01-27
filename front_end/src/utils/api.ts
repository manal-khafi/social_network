import api from '../api/axios';

export const socialLoginBackend = async (idToken: string, provider: "google" | "facebook") => {
  const response = await api.post("/authentication/social-login", {
    idToken,
    provider,
  });

  return response.data;
};

