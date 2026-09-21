import { Router } from "express";
import { handleWebhook } from "../controllers/pluggy.controller";

const router = Router();

// Webhook sem autenticação JWT — quem chama é a Pluggy, não o usuário.
// Validado pelo segredo na URL (ver pluggy.controller).
router.post("/webhook", handleWebhook);

export default router;
