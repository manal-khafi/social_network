import "express-async-errors";
import express from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import { logger } from "./util/logger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import AuthenticationRoutes from "./Routes/Authentication";
import commentRouter from "./Routes/Comment";
import FollowRoutes from "./Routes/Following";
import SignaleRouter from "./Routes/Signale";
import ComptRouter from "./Routes/Comproutes";
import ProfileRouter from "./Routes/Profile";
import postsRouter from "./Routes/Posts";
import SearchRoutes from "./Routes/Search";
import AccountRouter from "./Routes/accountroutes";
import MyLikedPosts from "./Routes/postRoutes";
import BlockRoutes from "./Routes/BlockRoute";
import SaveRoutes from "./Routes/saveRoutes";
import PrivacySettingsRoutes from "./Routes/privacySEttingsRoutes";
import twoFactorRouter from "./Routes/TwoFactorAuth";
import communityRoutes from "./Routes/communityRoutes";
import { authMiddleware } from "./Middleware/authMiddlware";
import storyRoutes from "./Routes/story.routes";
import conversationRoutes from "./Routes/conversationRoutes";
import notificationRoutes from "./Routes/Notification";
import UploadRouter from "./Routes/Upload";
import { getIceServers } from "./Controllers/rtc.controller";
import { errorHandler } from "./util/error";

import dotenv from "dotenv";
dotenv.config();

// The Express application, without any network side effect: importing this
// module does not open a port, so tests can drive it with supertest. The HTTP
// server, Socket.IO and the email service are started in ./index.ts.
const app = express();
// JSON / urlencoded bodies only carry text and media URLs (files are multipart
// uploads handled by multer, see Routes/Upload.ts), so keep this small.
const bodyLimit = process.env.BODY_LIMIT || "1mb";

// Running behind nginx / a load balancer: trust the first proxy hop so that
// secure cookies, req.protocol and express-rate-limit see the real client IP.
app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["https://socialnetworkes.vercel.app"];

// Per-request structured logging with a generated request id (req.log / req.id).
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/health" },
  })
);

// Security headers. crossOriginResourcePolicy is relaxed so that uploaded
// media can be embedded by the frontend when it is served from another origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "x-refresh-token"
  ],
  // Let the browser read the rotated access token when the API is cross-origin.
  exposedHeaders: ["x-access-token"],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(cookieParser());

// Coarse global rate limit. Route-level limiters (auth, 2FA, register) stack on top.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.GLOBAL_RATE_LIMIT || 1000),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Liveness/readiness probe for Docker / load balancers.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

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
app.use('/api/stories', storyRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.get('/api/rtc/ice-servers', authMiddleware, getIceServers);
app.use('/api/upload', UploadRouter);

app.use("/api/communities", authMiddleware, communityRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Social Network API',
    version: '1.0.0',
  });
});

// Unknown route -> JSON 404 (instead of Express' default HTML page).
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralised error handler. Must be registered last and keep its 4 arguments.
app.use(errorHandler);

export { app, allowedOrigins };
export default app;
