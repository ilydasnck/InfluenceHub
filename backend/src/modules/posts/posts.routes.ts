import { Router } from "express";
import { getDatabase } from "../../shared/database";
import { createPostsService } from "./posts.service";
import { createPostsController } from "./posts.controller";
import { logger } from "../../shared/logger";

const db = getDatabase();
const service = createPostsService(db);
const controller = createPostsController(service);
let schedulerStarted = false;

function startScheduledPublisher() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const intervalMs = Number(process.env.POST_SCHEDULER_INTERVAL_MS ?? "30000");
  setInterval(() => {
    void service.processDueScheduled(10).catch((error: unknown) => {
      logger.error(
        "Planli gonderi isleyici hatasi",
        "PostsScheduler",
        error instanceof Error ? { message: error.message, stack: error.stack } : { error: String(error) },
      );
    });
  }, Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 30000);
}

startScheduledPublisher();

const postsRouter = Router();

postsRouter.post("/publish-now", (req, res) => {
  void controller.publishNow(req, res);
});

postsRouter.post("/schedule", (req, res) => {
  void controller.schedule(req, res);
});

postsRouter.get("/history", (req, res) => {
  void controller.history(req, res);
});

postsRouter.get("/scheduled", (req, res) => {
  void controller.scheduled(req, res);
});

export { postsRouter };
