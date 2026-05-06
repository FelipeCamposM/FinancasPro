import { Router } from "express";
import {
  listAssinaturas,
  getAssinatura,
  createAssinatura,
  updateAssinatura,
  cancelAssinatura,
  reativarAssinatura,
  deleteAssinatura,
} from "../controllers/assinaturas.controller";
import { authenticateAny } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createAssinaturaSchema,
  cancelAssinaturaSchema,
  updateAssinaturaSchema,
} from "../schemas/assinaturas.schema";

const router = Router();

router.use(authenticateAny);

/**
 * @swagger
 * tags:
 *   name: Assinaturas
 *   description: Gestão de cobranças recorrentes mensais
 */

/** GET /assinaturas — listar (query: ativa=true|false) */
router.get("/", listAssinaturas);

/** GET /assinaturas/:id — detalhe com lançamentos */
router.get("/:id", getAssinatura);

/** POST /assinaturas — criar assinatura e gerar lançamentos futuros */
router.post("/", validate(createAssinaturaSchema), createAssinatura);

/** PUT /assinaturas/:id — atualizar descricao/valor/categoria/observacoes */
router.put("/:id", validate(updateAssinaturaSchema), updateAssinatura);

/** POST /assinaturas/:id/cancelar — cancelar e remover cobranças futuras */
router.post(
  "/:id/cancelar",
  validate(cancelAssinaturaSchema),
  cancelAssinatura,
);

/** POST /assinaturas/:id/reativar — reativar e gerar lançamentos futuros */
router.post("/:id/reativar", reativarAssinatura);

/** DELETE /assinaturas/:id — excluir assinatura (mantém histórico pago) */
router.delete("/:id", deleteAssinatura);

export default router;
