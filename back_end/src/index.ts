import express from "express";
// @ts-ignore
import cors from "cors";
import AuthentificationRoutes from "./Routes/Authentification";
import dotenv from "dotenv";
import { initializeEmailService } from "./config/EmailConfig";

dotenv.config();

const port = process.env.PORT || 3500;
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

initializeEmailService();
app.use("/api/authentification", AuthentificationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'api socielle network",
  });
});

app.listen(port, () => {
  console.log(`port connected en http://localhost:${port}`);
});
