import { Router } from "express";
import { createHttpClient } from "../../shared/httpClient";
import { getDatabase } from "../../shared/database";
import { createAuthService } from "./auth.service";
import { createAuthController } from "./auth.controller";

const FACEBOOK_GRAPH_API_BASE = "https://graph.facebook.com";

const facebookClient = createHttpClient(FACEBOOK_GRAPH_API_BASE);
const db = getDatabase();
const service = createAuthService(facebookClient, db);
const controller = createAuthController(service);

const authRouter = Router();

authRouter.get("/instagram", (req, res) => {
  controller.handleRedirect(req, res);
});

authRouter.get("/instagram/callback", (req, res) => {
  controller.handleCallback(req, res);
});

authRouter.get("/instagram/account/:userId", (req, res) => {
  controller.handleGetAccount(req, res);
});

export { authRouter };
