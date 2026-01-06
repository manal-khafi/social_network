import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token"); // Get token from URL
    if (!token) {
      alert("Token is missing!");
      navigate("/"); // redirect to login
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`http://localhost:3500/api/authentification/verify-email?token=${token}`);
        const data = await res.json();

        alert(data.message);
        if (data.success) {
          navigate("/"); // redirect to login page
        }
      } catch (error) {
        alert("Server error. Please try again later.");
        navigate("/"); // redirect on error
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return null;
};

export default VerifyEmail;
