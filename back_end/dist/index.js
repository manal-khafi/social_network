"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const Authentication_1 = __importDefault(require("./Routes/Authentication"));
const Comment_1 = __importDefault(require("./Routes/Comment"));
const Following_1 = __importDefault(require("./Routes/Following"));
const Signale_1 = __importDefault(require("./Routes/Signale"));
const Comproutes_1 = __importDefault(require("./Routes/Comproutes"));
const Profile_1 = __importDefault(require("./Routes/Profile"));
const Posts_1 = __importDefault(require("./Routes/Posts"));
const Search_1 = __importDefault(require("./Routes/Search"));
const EmailConfig_1 = require("./config/EmailConfig");
const accountroutes_1 = __importDefault(require("./Routes/accountroutes"));
const postRoutes_1 = __importDefault(require("./Routes/postRoutes"));
const BlockRoute_1 = __importDefault(require("./Routes/BlockRoute"));
const saveRoutes_1 = __importDefault(require("./Routes/saveRoutes"));
const privacySEttingsRoutes_1 = __importDefault(require("./Routes/privacySEttingsRoutes"));
const TwoFactorAuth_1 = __importDefault(require("./Routes/TwoFactorAuth"));
const communityRoutes_1 = __importDefault(require("./Routes/communityRoutes"));
const Inbox_1 = __importDefault(require("./Routes/Inbox"));
const Notifications_1 = __importDefault(require("./Routes/Notifications"));
const authMiddlware_1 = require("./Middleware/authMiddlware");
const socketServer_1 = require("./sockets/socketServer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = process.env.PORT || 3500;
const app = (0, express_1.default)();
const bodyLimit = process.env.BODY_LIMIT || "100mb";
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173"];
app.use((0, cors_1.default)({
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
app.use(express_1.default.json({ limit: bodyLimit }));
app.use(express_1.default.urlencoded({ extended: true, limit: bodyLimit }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
(0, EmailConfig_1.initializeEmailService)();
app.use("/api/authentication", Authentication_1.default);
app.use("/api/comments", Comment_1.default);
app.use("/api/follow", Following_1.default);
app.use("/api/reports", Signale_1.default);
app.use("/api/Compte", Comproutes_1.default);
app.use("/api/profile", Profile_1.default);
app.use("/api/posts", Posts_1.default);
app.use("/api/search", Search_1.default);
app.use("/api/posts", postRoutes_1.default);
app.use("/api", BlockRoute_1.default);
app.use("/api/saves", saveRoutes_1.default);
app.use("/api/account", accountroutes_1.default);
app.use("/api/privacy", privacySEttingsRoutes_1.default);
app.use("/api/auth", TwoFactorAuth_1.default);
app.use('/api/stories', story_routes_1.default);
app.use(express_1.default.json());
app.use("/api/communities", authMiddlware_1.authMiddleware, communityRoutes_1.default);
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: 'Bienvenue sur l\'API Social Network',
        version: '1.0.0',
    });
});
app.listen(port, () => {
app.use(express_1.default.json());
app.use("/api/communities", authMiddlware_1.authMiddleware, communityRoutes_1.default);
app.use("/api/inbox", Inbox_1.default);
app.use("/api/notifications", Notifications_1.default);
app.get("/", (req, res) => {
    res.json({
        message: "Bienvenue sur l'api socielle network",
    });
});
const httpServer = (0, socketServer_1.createHttpServer)(app);
(0, socketServer_1.initSocketServer)(httpServer, allowedOrigins);
httpServer.listen(port, () => {
    console.log(`port connected en http://localhost:${port}`);
});

