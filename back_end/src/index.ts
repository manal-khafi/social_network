import http from "http";
import { app, allowedOrigins } from "./app";
import { logger } from "./util/logger";
import { initRealtime } from "./realtime/io";
import { initializeEmailService } from "./config/EmailConfig";

const port = process.env.PORT || 3500;

initializeEmailService();

const server = http.createServer(app);
initRealtime(server, allowedOrigins);

server.listen(port, () => {
  logger.info({ port }, "API listening");
});

// Graceful shutdown so Prisma closes its pool and sockets drain.
const shutdown = (signal: string) => {
  logger.info({ signal }, "shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
