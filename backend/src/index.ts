import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { instagramRouter } from "./modules/instagram/instagram.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { testRouter } from "./modules/test/test.routes";
import { accountsRouter } from "./modules/accounts/accounts.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json());
app.get("/test", (req, res) => {
  res.sendFile(path.resolve(process.cwd(), "public", "test.html"));
});

app.get("/", (req, res) => {
  res.json({ message: "InfluenceHub API çalışıyor 🚀" });
});

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/instagram", instagramRouter);
app.use("/api/test", testRouter);

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
