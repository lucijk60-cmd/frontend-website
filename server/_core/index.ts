import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter, sanitizeFileName, validateUpload } from "../routers";
import { createAdminMedia, hashVisitorKey, recordVisitorEvent } from "../db";
import { storagePut } from "../storage";
import { isAdminSession } from "../adminAuth";
import { registerCallSignaling } from "../callSignaling";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.use((req, _res, next) => {
    if (req.method === "GET" && req.path === "/") {
      const forwardedFor = req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
      const userAgent = req.header("user-agent") ?? "unknown";
      const deviceClass = /ipad|tablet/i.test(userAgent) ? "tablet" : /mobile|android|iphone/i.test(userAgent) ? "mobile" : /windows|macintosh|linux/i.test(userAgent) ? "desktop" : "unknown";
      const countryCode = (req.header("cf-ipcountry") ?? req.header("x-country-code") ?? req.header("x-vercel-ip-country") ?? "unknown").slice(0, 8).toUpperCase();
      void recordVisitorEvent({
        visitorKeyHash: hashVisitorKey(`${forwardedFor}|${userAgent}`),
        path: "/",
        countryCode: countryCode || "unknown",
        deviceClass,
        referrer: req.header("referer")?.slice(0, 512) ?? null,
      }).catch(error => console.warn("[Analytics] Visitor event not recorded:", error));
    }
    next();
  });
  const server = createServer(app);
  registerCallSignaling(server);
  // Configure body parser with larger size limit for file uploads
  // Base64 adds roughly one third overhead; allow a raw 50 MB video plus JSON envelope.
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true, parameterLimit: 100000 }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/admin/media/upload-binary", express.raw({ type: "application/octet-stream", limit: "55mb" }), async (req, res) => {
    try {
      if (!(await isAdminSession(req))) { res.status(403).json({ message: "Admin access required" }); return; }
      const kind = req.header("x-media-kind");
      const language = req.header("x-media-language");
      const title = decodeURIComponent(req.header("x-media-title") ?? "");
      const fileName = decodeURIComponent(req.header("x-media-filename") ?? "");
      const mimeType = req.header("x-media-mime-type") ?? "";
      const pairKey = req.header("x-media-pair-key") || undefined;
      const publish = req.header("x-media-publish") === "true";
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if ((kind !== "image" && kind !== "video") || (language !== "en" && language !== "ar" && language !== "shared") || title.trim().length < 2 || title.length > 180 || !/^[^/\\\\]+\\.[a-zA-Z0-9]{2,5}$/.test(fileName) || !mimeType) {
        res.status(400).json({ message: "Invalid media metadata." }); return;
      }
      validateUpload({ kind, language, pairKey, title: title.trim(), fileName, mimeType, dataBase64: "x".repeat(20), publish }, body.byteLength);
      const storagePath = `admin-media/${kind}/${language}/${pairKey ? `${pairKey}-` : ""}${Date.now()}-${sanitizeFileName(fileName)}`;
      const stored = await storagePut(storagePath, body, mimeType);
      const saved = await createAdminMedia({ kind, language, pairKey, title: title.trim(), storageKey: stored.key, url: stored.url, mimeType, sizeBytes: body.byteLength, status: publish ? "published" : "draft" });
      res.status(200).json({ success: true, id: saved.id, url: stored.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Media upload failed.";
      res.status(message.includes("supported") || message.includes("under") || message.includes("extension") ? 400 : 500).json({ message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
