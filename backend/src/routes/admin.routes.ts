import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { getStats, listUsers, updateUserLevel, createAdminCheckout } from "../controllers/admin.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/stats", getStats);
router.get("/users", paginate, listUsers);
router.patch("/users/:id/level", updateUserLevel);
router.post("/users/:id/checkout", createAdminCheckout);

export default router;
