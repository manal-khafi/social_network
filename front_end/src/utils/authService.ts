import api from "../api/axios";

export const forgotPassword = async (email: string): Promise<string> => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data.message;
};
