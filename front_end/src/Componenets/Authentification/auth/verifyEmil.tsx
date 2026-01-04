// src/components/VerifyEmail.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type VerifyResponse = {
  success: boolean;
  message: string;
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Token manquant !");
      return;
    }

    const verifyEmail = async () => {
      try {
        console.log("Envoi de la requête de vérification avec le token :", token);
        const res = await fetch(`http://localhost:3500/api/authentification/verify-email?token=${token}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });


        const data: VerifyResponse = await res.json();
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Votre email a été vérifié avec succès !");
        } else {
          setStatus("error");
          setMessage(data.message || "Le lien est invalide ou expiré.");
        }

        
      } catch (error) {
        setStatus("error");
        setMessage("Erreur serveur. Veuillez réessayer plus tard.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg max-w-md text-center">
        {status === "loading" && <p>⏳ Vérification en cours...</p>}
        {status === "success" && <p className="text-green-600 font-bold">{message}</p>}
        {status === "error" && <p className="text-red-600 font-bold">{message}</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;
