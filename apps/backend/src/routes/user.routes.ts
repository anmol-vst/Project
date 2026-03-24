import { Router } from "express";
import * as UserController from "../controllers/user.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import { updateProfileSchema } from "../zodValidation/UserValidation.js";
import { paginationSchema, adminUpdateUserSchema, adminUpdateSubscriptionSchema } from "../zodValidation/AdminValidation.js";

const router:Router = Router();

// Protected 
router.get("/me/profile", requireAuth, UserController.getProfile);
router.patch("/me/profile", requireAuth, validateBody(updateProfileSchema), UserController.updateProfile);

// Admin 
router.get("/", requireAuth, requireAdmin, validateQuery(paginationSchema), UserController.getAllUsers);
router.get("/:id", requireAuth, requireAdmin, UserController.getUserById);
router.patch("/:id", requireAuth, requireAdmin, validateBody(adminUpdateUserSchema), UserController.adminUpdateUser);
router.patch("/:id/subscription", requireAuth, requireAdmin, validateBody(adminUpdateSubscriptionSchema), UserController.adminUpdateSubscription);

export default router;