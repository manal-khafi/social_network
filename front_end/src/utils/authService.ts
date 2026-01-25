import api from "../api/axios";

export const forgotPassword = async (email: string): Promise<string> => {
  const res = await api.post("/authentication/forgot-password", { email });
  return res.data.message;
};
