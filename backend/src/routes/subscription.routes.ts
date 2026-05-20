import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  createCheckout,
  cancelSubscription,
  getStatus,
  handleWebhook,
  changePlan,
} from "../controllers/subscription.controller";

const router = Router();

// Webhook sem autenticação JWT — validado pela assinatura Mercado Pago
router.post("/webhook", handleWebhook);

router.use(authenticate);

router.post("/checkout",  createCheckout);
router.delete("/",        cancelSubscription);
router.get("/status",     getStatus);
router.patch("/plan",     changePlan);

export default router;
