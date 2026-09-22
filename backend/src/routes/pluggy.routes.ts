import { Router } from "express";
import {
  handleWebhook,
  listItems,
  createItem,
  deleteItem,
} from "../controllers/pluggy.controller";
import { authenticate, requireOpenFinance } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createPluggyItemSchema,
  pluggyItemParamsSchema,
} from "../schemas/pluggy.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pluggy
 *   description: Integração Open Finance (conector MeuPluggy)
 */

// Webhook sem autenticação JWT — quem chama é a Pluggy, não o usuário.
// Validado pelo segredo na URL (ver pluggy.controller).
router.post("/webhook", handleWebhook);

router.use(authenticate, requireOpenFinance);

/**
 * @swagger
 * /pluggy/items:
 *   get:
 *     tags: [Pluggy]
 *     summary: Listar conexões Pluggy do usuário
 *     responses:
 *       200: { description: Lista de conexões }
 *       403: { description: Open Finance não habilitado para a conta }
 *   post:
 *     tags: [Pluggy]
 *     summary: Cadastrar o itemId de uma conexão copiada do dashboard da Pluggy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_id]
 *             properties:
 *               item_id: { type: string, format: uuid }
 *               apelido: { type: string, maxLength: 100 }
 *     responses:
 *       201: { description: Conexão cadastrada }
 *       422: { description: Dados inválidos }
 */
router.get("/items", listItems);
router.post("/items", validate(createPluggyItemSchema), createItem);

/**
 * @swagger
 * /pluggy/items/{id}:
 *   delete:
 *     tags: [Pluggy]
 *     summary: Remover uma conexão cadastrada
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Removida }
 *       404: { description: Conexão não encontrada }
 */
router.delete(
  "/items/:id",
  validate(pluggyItemParamsSchema, "params"),
  deleteItem,
);

export default router;
