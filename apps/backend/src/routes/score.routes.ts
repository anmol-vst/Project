import { Router } from "express";
import * as ScoreController from "../controllers/score.controller.js";
import { requireAuth, requireAdmin, requireSubscription } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { addScoreSchema, updateScoreSchema } from "../zodValidation/UserValidation.js";
import { adminUpdateScoreSchema } from "../zodValidation/AdminValidation.js";

const router:Router = Router();

// Protected + subscription required
router.get("/", requireAuth, requireSubscription, ScoreController.getScores);
router.post("/", requireAuth, requireSubscription, validateBody(addScoreSchema), ScoreController.addScore);
router.patch("/:scoreId", requireAuth, requireSubscription, validateBody(updateScoreSchema), ScoreController.updateScore);
router.delete("/:scoreId", requireAuth, requireSubscription, ScoreController.deleteScore);

// Admin — edit any user's score
router.patch("/admin/:userId/:scoreId", requireAuth, requireAdmin, validateBody(adminUpdateScoreSchema), ScoreController.adminUpdateScore);

export default router;