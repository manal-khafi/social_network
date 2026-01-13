import express from "express";
// @ts-ignore
import cors from "cors";
import AuthentificationRoutes from "./Routes/Authentification";
import commentRouter from "./Routes/Comment";
import FollowRoutes from "./Routes/Following";
import SignaleRouter from "./Routes/Signale";
import ComptRouter from "./Routes/Comproutes";
import dotenv from "dotenv";
import multer from "multer";



import { initializeEmailService } from "./config/EmailConfig";

dotenv.config();
initializeEmailService();

dotenv.config();
const port = process.env.PORT || 3500;
const app = express();
app.use(express.json());

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


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});



dotenv.config();



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
