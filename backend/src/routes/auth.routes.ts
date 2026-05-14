import { Router } from "express";
import {
  register,
  login,
  me,
  requestEmailVerification,
  verifyEmail,
  requestLoginCode,
  verifyLoginCode,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  registerSchema,
  loginSchema,
  emailCodeRequestSchema,
  emailCodeVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/verify-email/request", validate(emailCodeRequestSchema), requestEmailVerification);
router.post("/verify-email", validate(emailCodeVerifySchema), verifyEmail);
router.post("/login-code/request", validate(emailCodeRequestSchema), requestLoginCode);
router.post("/login-code/verify", validate(emailCodeVerifySchema), verifyLoginCode);
router.get("/me", authenticate, me);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
