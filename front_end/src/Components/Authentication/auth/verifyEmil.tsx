import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { toast } from "sonner";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token"); // Get token from URL
    if (!token) {
      toast.error("Token is missing!");
      navigate("/"); // redirect to login
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await api.get(`/authentication/verify-email?token=${token}`);
        const data = res.data;

        toast.success(data.message);
        if (data.success) {
          navigate("/"); // redirect to login page
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Server error. Please try again later.");
        navigate("/"); // redirect on error
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return null;
};

export default VerifyEmail;
