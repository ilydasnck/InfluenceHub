import { Router } from "express";
import { createHttpClient } from "../../shared/httpClient";
import { getDatabase } from "../../shared/database";
import { createInstagramRepository } from "./instagram.repository";
import { createInstagramService } from "./instagram.service";
import { createInstagramController } from "./instagram.controller";
import { createAuthService } from "../auth/auth.service";

const FACEBOOK_GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

const graphClient = createHttpClient(FACEBOOK_GRAPH_API_BASE);
const db = getDatabase();

const repository = createInstagramRepository(graphClient);
const instagramService = createInstagramService(repository);
const authService = createAuthService(graphClient, db);
const controller = createInstagramController(instagramService, authService);

const instagramRouter = Router();

instagramRouter.post("/publish", (req, res) => {
  controller.handlePublishMedia(req, res);
});

instagramRouter.get("/status/:mediaId", (req, res) => {
  controller.handleGetMediaStatus(req, res);
});

export { instagramRouter };
