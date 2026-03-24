import { Router } from "express";
import * as AuthController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { signupSchema, loginSchema, changePasswordSchema } from "../zodValidation/UserValidation.js";

const router:Router = Router();

router.post("/signup", validateBody(signupSchema), AuthController.signup);
router.post("/login", validateBody(loginSchema), AuthController.login);

router.get("/me", requireAuth, AuthController.getMe);
router.patch("/change-password", requireAuth, validateBody(changePasswordSchema), AuthController.changePassword);

export default router;