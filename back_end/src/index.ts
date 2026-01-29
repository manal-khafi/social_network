import express from "express";
import cors from "cors";
import path from "path";
import AuthenticationRoutes from "./Routes/Authentication";
import commentRouter from "./Routes/Comment";
import FollowRoutes from "./Routes/Following";
import SignaleRouter from "./Routes/Signale";
import ComptRouter from "./Routes/Comproutes";
import ProfileRouter from "./Routes/Profile";
import postsRouter from "./Routes/Posts";
import SearchRoutes from "./Routes/Search";
import { initializeEmailService } from "./config/EmailConfig";
import AccountRouter from "./Routes/accountroutes";
import MyLikedPosts from "./Routes/postRoutes";
import BlockRoutes from "./Routes/BlockRoute";
import SaveRoutes from "./Routes/saveRoutes";
import PrivacySettingsRoutes from "./Routes/privacySEttingsRoutes";
import twoFactorRouter from "./Routes/TwoFactorAuth";
import communityRoutes from "./Routes/communityRoutes";
import { authMiddleware } from "./Middleware/authMiddlware";

import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT || 3500;
const app = express();
const bodyLimit = process.env.BODY_LIMIT || "100mb";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins,
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

app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

initializeEmailService();
app.use("/api/authentication", AuthenticationRoutes);
app.use("/api/comments", commentRouter);
app.use("/api/follow", FollowRoutes);
app.use("/api/reports", SignaleRouter);
app.use("/api/Compte", ComptRouter);
app.use("/api/profile", ProfileRouter);
app.use("/api/posts", postsRouter);
app.use("/api/search", SearchRoutes);
app.use("/api/posts", MyLikedPosts);
app.use("/api", BlockRoutes);
app.use("/api/saves", SaveRoutes);
app.use("/api/account", AccountRouter);
app.use("/api/privacy", PrivacySettingsRoutes);
app.use("/api/auth", twoFactorRouter);
app.use(express.json());

app.use("/api/communities", authMiddleware, communityRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'api socielle network",
  });
});

app.listen(port, () => {
  console.log(`port connected en http://localhost:${port}`);
});