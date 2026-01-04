import express from "express";
import cors from "cors";
import AuthentificationRoutes from "./Routes/Authentification";
import dotenv from "dotenv";


dotenv.config();

const port = 3500;
const app = express();

app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept"
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));



import { initializeEmailService } from "./config/EmailConfig";

dotenv.config();
initializeEmailService();
app.use(express.json());

app.use("/api/authentification", AuthentificationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'api socielle network",
  });
});

app.listen(port, () => {
  console.log(`port connected en http://localhost:${port}`);
});
