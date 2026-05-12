import { Router } from "express";
import { generateToken, activateToken, getMyKey, rotateKey } from "../controllers/shortcut.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/token", authenticate, generateToken);
router.get("/activate", activateToken);
router.get("/my-key", authenticate, getMyKey);
router.post("/rotate-key", authenticate, rotateKey);

export default router;
