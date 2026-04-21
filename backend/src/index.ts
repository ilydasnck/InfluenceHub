import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { instagramRouter } from "./modules/instagram/instagram.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { testRouter } from "./modules/test/test.routes";
import { accountsRouter } from "./modules/accounts/accounts.routes";
import { postsRouter } from "./modules/posts/posts.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

async function agentDebugLog(
  location: string,
  message: string,
  hypothesisId: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  await fetch("http://127.0.0.1:7311/ingest/7b6a73b3-fd64-4de7-924b-ed2482dc7d12", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "68c34c",
    },
    body: JSON.stringify({
      sessionId: "68c34c",
      runId: "run2",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

app.use(
  cors({
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "30mb" }));
app.use("/uploads", (req, res, next) => {
  void agentDebugLog("index.ts:/uploads", "Incoming uploads request", "H5", {
    method: req.method,
    url: req.originalUrl,
    ua: req.headers["user-agent"] ?? null,
    accept: req.headers.accept ?? null,
    host: req.headers.host ?? null,
  });
  next();
});
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "public", "uploads"), {
    setHeaders(res, filePath) {
      void agentDebugLog("index.ts:express.static", "Serving upload file", "H5", {
        filePath,
        contentType: res.getHeader("Content-Type") ?? null,
      });
    },
  }),
);
app.get("/test", (req, res) => {
  res.sendFile(path.resolve(process.cwd(), "public", "test.html"));
});

app.get("/", (req, res) => {
  res.json({ message: "InfluenceHub API çalışıyor 🚀" });
});

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/instagram", instagramRouter);
app.use("/api/test", testRouter);

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
