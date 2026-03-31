import { Router } from "express";
import { createHttpClient } from "../../shared/httpClient";
import { getDatabase } from "../../shared/database";
import { createAuthService } from "../auth/auth.service";
import { createAccountsController } from "./accounts.controller";

const FACEBOOK_GRAPH_API_BASE = "https://graph.facebook.com";
const facebookClient = createHttpClient(FACEBOOK_GRAPH_API_BASE);
const db = getDatabase();
const authService = createAuthService(facebookClient, db);
const controller = createAccountsController(db, authService);

const accountsRouter = Router();

accountsRouter.get("/", (req, res) => {
  void controller.list(req, res);
});

accountsRouter.post("/connect", (req, res) => {
  void controller.connect(req, res);
});

accountsRouter.delete("/:id", (req, res) => {
  void controller.remove(req, res);
});

export { accountsRouter };
