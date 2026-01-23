import express from "express";
import cors from "cors";
import path from "path";
import AuthentificationRoutes from "./Routes/Authentification";
import commentRouter from "./Routes/Comment";
import FollowRoutes from "./Routes/Following";
import SignaleRouter from "./Routes/Signale";
import ComptRouter from "./Routes/Comproutes";
import dotenv from "dotenv";
import { initializeEmailService } from "./config/EmailConfig";

dotenv.config();

const port = process.env.PORT || 3500;
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

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

initializeEmailService();
app.use("/api/authentification", AuthentificationRoutes);
app.use("/api/comments", commentRouter);
app.use("/api/Follow", FollowRoutes);
app.use("/api/reports", SignaleRouter);
app.use("/api/Compte", ComptRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'api socielle network",
  });
});

app.listen(port, () => {
  console.log(`port connected en http://localhost:${port}`);
});
